import styles from "./Login.module.css";
import React from "react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { signInWithCreds } from "../context/AuthContext";
import ColourMode from "../components/ColourMode";

export default function Login() {
  const navigate = useNavigate();
  const [errMessage, setErrMessage] = useState("");

  const signIn = async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
      await signInWithCreds(email, password);
      setErrMessage("");
      navigate("/");
    } catch (err) {
      setErrMessage("Email and/or Password Incorrect");
    }
  };

  return localStorage.getItem("isLoggedIn") === "true" ? (
    <Navigate to="/" />
  ) : (
    <main className={styles.pageContainer}>
      <section id="Header" className={styles.header}>
        <ColourMode />
      </section>
      <div className={styles.login_box}>
        <h1>Login</h1>
        <form className={styles.login_form} onSubmit={signIn}>
          <input className={styles.input_text} type="text" placeholder="email" />
          <input className={styles.input_text} type="password" placeholder="password" />
          <input className={styles.button} type="submit" value="Login" />
          <p>{errMessage}</p>
        </form>
        <p>Only users with an account created by the owner can access this website</p>
      </div>
    </main>
  );
}
