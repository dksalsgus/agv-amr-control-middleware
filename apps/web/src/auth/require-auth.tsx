import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { tokenStorage } from "./token-storage";

type Props = { children: ReactNode };

/** 토큰이 없거나 만료되었으면 로그인 화면으로 보내고, 로그인 뒤 원래 주소로 돌아온다. */
export const RequireAuth = ({ children }: Props) => {
  const location = useLocation();
  const session = tokenStorage.find();
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
};
