-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- CHANNELS TABLE
CREATE TABLE channels (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT fk_channels_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- CHANNEL FOLLOWERS TABLE
CREATE TABLE channel_followers (
    user_id UUID NOT NULL,
    channel_id UUID NOT NULL,
    followed_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT pk_channel_followers PRIMARY KEY (user_id, channel_id),

    CONSTRAINT fk_channel_followers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_channel_followers_channel
        FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE
);


CREATE INDEX idx_channels_owner_id ON channels(owner_id);
CREATE INDEX idx_channels_name ON channels(name);
