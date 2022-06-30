import React from "react";
import { Link, Navigate } from "react-router-dom";

import styles from "./Final.module.css";

function Final(props) {
  return props.src ? (
    <div className={styles.container}>
      <div className={styles.title}>
        <Link to="/"> {"<-"} Editor</Link>
        <h2>Finalized image </h2>
      </div>

      <div className={styles.image}>
        <img src={props.src} alt="Image" />
      </div>
    </div>
  ) : (
    <Navigate to="/" />
  );
}

export default Final;
