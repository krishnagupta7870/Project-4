import React, { createContext, useContext, useEffect, useState } from "react";
import api, { API_BASE_URL } from "../utils/api";

const LogoContext = createContext();

const DEFAULT_LOGO = "/images/logos/logo.svg";

export function LogoProvider({ children }) {
  const [logo, setLogo] = useState(DEFAULT_LOGO);

  const fetchLogo = async () => {
    try {
      const { data } = await api.get("/admin/settings/logo");
      if (data?.logo) {
         let src = data.logo;
         // If it starts with /uploads, it's relative to backend root
         if (src.startsWith("/uploads")) {
             // API_BASE_URL is http://localhost:5000/api
             // We need http://localhost:5000
             const baseUrl = API_BASE_URL.replace("/api", "");
             src = `${baseUrl}${src}`;
         }
         setLogo(src);
      } else {
          setLogo(DEFAULT_LOGO);
      }
    } catch (err) {
      // console.error("Failed to fetch logo", err);
      // Silent fail to default
      setLogo(DEFAULT_LOGO);
    }
  };

  useEffect(() => {
    fetchLogo();
  }, []);

  return (
    <LogoContext.Provider value={{ logo, fetchLogo }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  return useContext(LogoContext);
}
