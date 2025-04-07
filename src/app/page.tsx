"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "model";
  parts: string;
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const router = useRouter();

  const API_KEY = "AIzaSyB7No1LofBlyTlXwp-peScPfG6pITUOwOI";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.success) {
        console.log("Logged in user:", data.user);
        setUser(data.user);
        setLoggedIn(true);
        // No redirigimos inmediatamente para mostrar el chat
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setIsChatLoading(true);
    const userMessage: Message = {
      role: "user",
      parts: userInput,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setUserInput("");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: userInput,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to get response from Gemini");
      }

      const modelResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from model";
      
      const modelMessage: Message = {
        role: "model",
        parts: modelResponse,
      };

      setChatMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "model",
        parts: error instanceof Error ? error.message : "An error occurred",
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const goToPage1 = () => {
    router.push("/Page1");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-white-200">
      {!loggedIn ? (
        <div className="flex flex-col items-center bg-white h-120 w-100 text-black shadow-lg shadow-black p-4">
          <h1 className="mb-4 text-3xl font-bold mt-8">Welcome Back</h1>
          <form onSubmit={handleSubmit} className="space-y-10 mt-20">
            <div>
              <input
                type="text"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-60 text-black shadow-lg shadow-black p-2"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-60 text-black shadow-lg shadow-black p-2"
              />
            </div>

            <div>
              <button
                type="submit"
                className="bg-blue-500 h-10 w-60 text-white shadow-lg shadow-black"
                disabled={loading}
              >
                {loading ? "Cargando..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center bg-white h-[80vh] w-[80vw] max-w-3xl text-black shadow-lg shadow-black p-6 rounded-lg">
          <div className="flex justify-between w-full mb-4">
            <h1 className="text-2xl font-bold">Chat with Gemini</h1>
            <button
              onClick={goToPage1}
              className="bg-blue-500 px-4 py-2 text-white shadow-md rounded"
            >
              Go to Page 1
            </button>
          </div>
          
          <div className="flex-1 w-full overflow-y-auto mb-4 p-4 border border-gray-300 rounded">
            {chatMessages.length === 0 ? (
              <p className="text-gray-500">Start a conversation with Gemini...</p>
            ) : (
              chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-100 ml-auto max-w-[80%]"
                      : "bg-gray-100 mr-auto max-w-[80%]"
                  }`}
                >
                  <p className="font-semibold">
                    {message.role === "user" ? "You" : "Gemini"}:
                  </p>
                  <p className="whitespace-pre-wrap">{message.parts}</p>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex items-center justify-center p-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="w-full flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded shadow-sm"
              disabled={isChatLoading}
            />
            <button
              type="submit"
              className="bg-blue-500 px-4 py-2 text-white rounded shadow-sm"
              disabled={isChatLoading}
            >
              {isChatLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}