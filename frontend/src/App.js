import { useState } from "react";

function App() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [result, setResult] = useState(null);

  const login = async () => {

    try {

      const response = await fetch(
        "http://localhost:8080/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        setResult(data);
        return;
      }

      // เก็บ JWT
      localStorage.setItem("token", data.token);

      setToken(data.token);

      setResult({
        message: "Login success"
      });

    } catch (error) {

      console.error(error);

      setResult({
        error: "Cannot connect to backend"
      });
    }
  };


  const getMe = async () => {

    const token = localStorage.getItem("token");

    console.log("TOKEN:", token);

    const response = await fetch(
      "http://localhost:8080/api/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    const data = await response.json();

    setResult(data);
  };


  const logout = () => {

    localStorage.removeItem("token");

    setToken(null);

    setResult({
      message: "Logged out"
    });
  };


  return (
    <div style={{ padding: "40px" }}>

      <h1>JWT Authentication Test</h1>


      <div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

      </div>


      <br />


      <div>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

      </div>


      <br />


      <button onClick={login}>
        Login
      </button>


      <button
        onClick={getMe}
        disabled={!token}
        style={{ marginLeft: "10px" }}
      >
        Get My Info
      </button>


      <button
        onClick={logout}
        style={{ marginLeft: "10px" }}
      >
        Logout
      </button>


      <hr />


      <h3>Token</h3>

      <p>
        {token || "No token"}
      </p>


      <h3>Result</h3>

      <pre>
        {JSON.stringify(result, null, 2)}
      </pre>

    </div>
  );
}

export default App;