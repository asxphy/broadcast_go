package handlers

import (
	"encoding/json"
	"flag"
	"net/http"
	"sync"
	"text/template"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/logging"
	"github.com/pion/rtp"
	"github.com/pion/webrtc/v4"
)

var (
	addr = flag.String("addr", ":9090", "http service address")

	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	indexTemplate *template.Template
	log           = logging.NewDefaultLoggerFactory().NewLogger("room-sfu")

	rooms    = map[string]*Room{}
	roomsMux sync.Mutex
)

type websocketMessage struct {
	Event string `json:"event"`
	Data  string `json:"data"`
}

type peerState struct {
	pc *webrtc.PeerConnection
	ws *safeWS
}

type Room struct {
	lock   sync.Mutex
	peers  []peerState
	tracks map[string]*webrtc.TrackLocalStaticRTP
}

func getRoom(id string) *Room {
	roomsMux.Lock()
	defer roomsMux.Unlock()

	if r, ok := rooms[id]; ok {
		return r
	}

	r := &Room{
		tracks: map[string]*webrtc.TrackLocalStaticRTP{},
	}
	rooms[id] = r
	return r
}

func (r *Room) addPeer(p peerState) {
	r.lock.Lock()
	r.peers = append(r.peers, p)
	r.lock.Unlock()
	r.signalPeerConnections()
}

func (r *Room) removePeer(pc *webrtc.PeerConnection) {
	r.lock.Lock()
	for i, p := range r.peers {
		if p.pc == pc {
			r.peers = append(r.peers[:i], r.peers[i+1:]...)
			break
		}
	}
	r.lock.Unlock()
	r.signalPeerConnections()
}

func (r *Room) addTrack(t *webrtc.TrackRemote) *webrtc.TrackLocalStaticRTP {
	track, _ := webrtc.NewTrackLocalStaticRTP(
		t.Codec().RTPCodecCapability,
		t.ID(),
		t.StreamID(),
	)

	r.lock.Lock()
	r.tracks[t.ID()] = track
	r.lock.Unlock()

	r.signalPeerConnections()
	return track
}

func (r *Room) removeTrack(id string) {
	r.lock.Lock()
	delete(r.tracks, id)
	r.lock.Unlock()
	r.signalPeerConnections()
}

func (room *Room) signalPeerConnections() {
	room.lock.Lock()
	defer func() {
		room.lock.Unlock()
	}()
	peerConnections := room.peers
	attemptSync := func() (tryAgain bool) {
		for i := range peerConnections {
			if peerConnections[i].pc.ConnectionState() == webrtc.PeerConnectionStateClosed {
				peerConnections = append(peerConnections[:i], peerConnections[i+1:]...)

				return true
			}

			existingSenders := map[string]bool{}

			for _, sender := range peerConnections[i].pc.GetSenders() {
				if sender.Track() == nil {
					continue
				}

				existingSenders[sender.Track().ID()] = true

				if _, ok := room.tracks[sender.Track().ID()]; !ok {
					if err := peerConnections[i].pc.RemoveTrack(sender); err != nil {
						return true
					}
				}
			}

			for _, receiver := range peerConnections[i].pc.GetReceivers() {
				if receiver.Track() == nil {
					continue
				}

				existingSenders[receiver.Track().ID()] = true
			}

			// Add all track we aren't sending yet to the PeerConnection
			for trackID := range room.tracks {
				if _, ok := existingSenders[trackID]; !ok {
					if _, err := peerConnections[i].pc.AddTrack(room.tracks[trackID]); err != nil {
						return true
					}
				}
			}

			offer, err := peerConnections[i].pc.CreateOffer(nil)
			if err != nil {
				return true
			}

			if err = peerConnections[i].pc.SetLocalDescription(offer); err != nil {
				return true
			}

			offerString, err := json.Marshal(offer)
			if err != nil {
				log.Errorf("Failed to marshal offer to json: %v", err)

				return true
			}

			log.Infof("Send offer to client: %v", offer)

			if err = peerConnections[i].ws.WriteJSON(&websocketMessage{
				Event: "offer",
				Data:  string(offerString),
			}); err != nil {
				return true
			}
		}

		return tryAgain
	}

	for syncAttempt := 0; ; syncAttempt++ {
		if syncAttempt == 25 {
			// Release the lock and attempt a sync in 3 seconds. We might be blocking a RemoveTrack or AddTrack
			go func() {
				time.Sleep(time.Second * 3)
				room.signalPeerConnections()
			}()

			return
		}

		if !attemptSync() {
			break
		}
	}
}

/* ===================== WEBSOCKET ===================== */

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	println("ws called")
	roomID := r.URL.Query().Get("room")
	print(roomID)
	if roomID == "" {
		http.Error(w, "room required", http.StatusBadRequest)
		return
	}

	room := getRoom(roomID)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	ws := &safeWS{Conn: conn}

	pc, err := webrtc.NewPeerConnection(webrtc.Configuration{})
	if err != nil {
		return
	}

	pc.AddTransceiverFromKind(
		webrtc.RTPCodecTypeAudio,
		webrtc.RTPTransceiverInit{
			Direction: webrtc.RTPTransceiverDirectionSendrecv,
		},
	)

	room.addPeer(peerState{pc: pc, ws: ws})
	println(roomID, ws, pc)
	pc.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}
		data, _ := json.Marshal(c.ToJSON())
		ws.WriteJSON(websocketMessage{
			Event: "candidate",
			Data:  string(data),
		})
	})

	pc.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		if s == webrtc.PeerConnectionStateFailed ||
			s == webrtc.PeerConnectionStateClosed {
			room.removePeer(pc)
			pc.Close()
		}
	})

	pc.OnTrack(func(t *webrtc.TrackRemote, _ *webrtc.RTPReceiver) {
		println("New track:", t.ID(), t.Kind().String(), pc)
		local := room.addTrack(t)
		defer room.removeTrack(t.ID())

		buf := make([]byte, 1500)
		pkt := &rtp.Packet{}

		for {
			n, _, err := t.Read(buf)
			if err != nil {
				return
			}
			if err = pkt.Unmarshal(buf[:n]); err != nil {
				return
			}
			local.WriteRTP(pkt)
		}
	})

	for {
		_, raw, err := ws.ReadMessage()
		if err != nil {
			room.removePeer(pc)
			pc.Close()
			return
		}

		msg := websocketMessage{}
		json.Unmarshal(raw, &msg)

		switch msg.Event {
		case "answer":
			ans := webrtc.SessionDescription{}
			json.Unmarshal([]byte(msg.Data), &ans)
			pc.SetRemoteDescription(ans)

		case "candidate":
			c := webrtc.ICECandidateInit{}
			json.Unmarshal([]byte(msg.Data), &c)
			pc.AddICECandidate(c)
		}
	}
}

// func main() {
// 	flag.Parse()

// 	html, err := os.ReadFile("index.html")
// 	if err != nil {
// 		log.Errorf("Failed to read index.html: %v", err)
// 		panic("index.html not found")
// 	}

// 	indexTemplate = template.Must(template.New("").Parse(string(html)))

// 	http.HandleFunc("/websocket", websocketHandler)
// 	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
// 		room := r.URL.Query().Get("room")
// 		if room == "" {
// 			room = "default"
// 		}
// 		indexTemplate.Execute(
// 			w,
// 			"ws://"+r.Host+"/websocket?room="+room,
// 		)
// 	})

// 	log.Infof("Server running on %s", *addr)

// 	// Actually check the error!
// 	if err := http.ListenAndServe(*addr, nil); err != nil {
// 		log.Errorf("Server failed: %v", err)
// 		panic(err)
// 	}
// }

type safeWS struct {
	*websocket.Conn
	sync.Mutex
}

func (s *safeWS) WriteJSON(v any) error {
	s.Lock()
	defer s.Unlock()
	return s.Conn.WriteJSON(v)
}
