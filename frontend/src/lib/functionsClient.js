// src/lib/functionsClient.js
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase"; // ensure you export 'app' in firebase.js

const functions = getFunctions(app); // if you choose a region later, pass getFunctions(app, "asia-south1")

export const requestSignupOtpFn = httpsCallable(functions, "requestSignupOtp");
export const verifySignupOtpFn = httpsCallable(functions, "verifySignupOtp");
export const sendLoginEmailFn = httpsCallable(functions, "sendLoginEmail");
