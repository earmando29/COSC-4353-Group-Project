import FingerprintJS from "@fingerprintjs/fingerprintjs"
import React, { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useLoginMutation } from "../api/apiSlice"
import { axiosPrivate } from "../api/axios"
import FormTextInput, { IInput } from "../components/FormComponent"
import useAuth from "../hooks/useAuth"
import "../styles/Login.css"

export default function Login() {
  const [login, isSuccess] = useLoginMutation()
  const [errorMessage, setErrorMessage] = useState("")
  const navigate = useNavigate()
  const { auth, setAuth } = useAuth()

  const getFingerprint = async () => {
    const fpPromise = await FingerprintJS.load()
    const fp = await fpPromise.get()
    return fp.visitorId
  }

  const handleOnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const target = e.target as HTMLFormElement
    e.preventDefault()
    const form = new FormData(target)
    // Convert FormData into a plain object
    const credentials = Object.fromEntries(form.entries())
    credentials.fingerprint = await getFingerprint()

    try {
      // Execute the mutation
      const response = await login(credentials).unwrap()
      if (!isSuccess) {
        if (response.message === "Bad Request") {
          setErrorMessage("Bad Request")
        } else if (response.message === "Unauthorized") {
          setErrorMessage("Username or password is incorrect")
        }
      } else {
        setAuth({
          user: response.username,
        })
        sessionStorage.setItem("auth", JSON.stringify(auth))
        try {
          const profile = await axiosPrivate.get("/profile-management")
          if (
            profile.data.message &&
            profile.data.message == "Profile loaded successfully"
          ) {
            navigate("/fuel-quote")
            return
          }
        } catch (err) {
          console.error("Profile failed", err)
          navigate("/profile")
        }
        navigate("/profile")
      }
      // Handle success (e.g., navigate to a dashboard)
    } catch (err) {
      console.error("Login failed", err)
    }
  }

  const forms: IInput[] = [
    {
      id: "username",
      name: "username",
      type: "text",
      label: "Username",
      required: true,
    },
    {
      id: "password",
      name: "password",
      type: "password",
      label: "Password",
      required: true,
    },
  ]

  return (
    <div id="loginContainer">
      <h1>Login</h1>
      {errorMessage.length > 0 ? (
        <div className="text-red-600">{errorMessage}</div>
      ) : (
        <div />
      )}
      <form onSubmit={handleOnSubmit}>
        {forms.map((forms) => (
          <FormTextInput key={forms.id} {...forms} />
        ))}
        <div id="buttons">
          <button id="login">Login</button>
        </div>
      </form>
      <div id="divider"></div>
      <NavLink to="/register">Register Here</NavLink>
    </div>
  )
}
