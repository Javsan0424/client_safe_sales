"use client";
import Menu from "../Components/navegar";

export default function Juego() {
    return (
        <div className="h-screen flex flex-row">
        
            
                <Menu />
            

            
            <main className="flex-1 p-10 overflow-auto">
                <div className="text-5xl mb-4">Juego</div>
                <iframe
                    src="https://manuelperezf.github.io/CRM/"
                    width="100%"
                    height="650px"
                    className="border rounded-xl"
                ></iframe>
            </main>
        </div>
    );
}
