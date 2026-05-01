import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_ORIGIN } from '../utils/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        const s = io(API_ORIGIN);
        setSocket(s);

        if (user?._id) {
            s.emit("join_room", user._id);
        }

        return () => {
            s.disconnect();
        };
    }, [user?._id]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
