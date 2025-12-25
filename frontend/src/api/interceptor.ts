import api from './axios'

let isRefreshing = false 

let queue: (()=> void)[] = []

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
            return new Promise((resolve)=>{
                queue.push(()=> {
                    resolve(api(originalRequest))
                })
            });
        }
        originalRequest._retry = true;
        isRefreshing = true;
        try{
            await api.post('/refresh');
            queue.forEach(callback => callback());

            queue = []

            return api(originalRequest)
        }
        catch(err){
            queue = []
            window.location.href = '/login'
            return Promise.reject(err)
        }finally{
            isRefreshing = false;
        }

    }
    return Promise.reject(error);
    }
)