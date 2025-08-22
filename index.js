import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const foodData = [
  { emoji: "🍎", hunger: 10, dirt: 5 },
  { emoji: "🍕", hunger: 20, dirt: 10 },
  { emoji: "🥩", hunger: 25, dirt: 12 },
  { emoji: "🍌", hunger: 15, dirt: 6 },
  { emoji: "🥕", hunger: 8, dirt: 4 },
];

export default function PetCareGame() {
  const [pet, setPet] = useState({
    hunger: 50,
    happiness: 50,
    energy: 50,
    cleanliness: 50,
    hp: 100,
  });

  const [coins, setCoins] = useState(10);
  const [busy, setBusy] = useState("");
  const [drops, setDrops] = useState([]);
  const [name, setName] = useState("My Pet");
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [dead, setDead] = useState(false);

  const gameAreaRef = useRef(null);

  // Needs decay
  useEffect(() => {
    const interval = setInterval(() => {
      setPet((prev) => {
        let newPet = {
          hunger: Math.max(0, prev.hunger - 1),
          happiness: Math.max(0, prev.happiness - 1),
          energy: Math.max(0, prev.energy - 1),
          cleanliness: Math.max(0, prev.cleanliness - 1),
          hp: prev.hp,
        };

        ["hunger", "happiness", "energy", "cleanliness"].forEach((stat) => {
          if (newPet[stat] === 0) {
            newPet.hp = Math.max(0, newPet.hp - 1);
          }
        });

        if (newPet.hp <= 0) setDead(true);
        return newPet;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Spawn random drops (coins or food)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameAreaRef.current) return;
      const areaWidth = gameAreaRef.current.offsetWidth;
      const size = Math.floor(Math.random() * 40) + 30;
      const isFood = Math.random() < 0.4;
      let emoji = "🪙";
      let value = Math.ceil(size / 10);
      let hunger = 0, dirt = 0;
      if (isFood) {
        const food = foodData[Math.floor(Math.random() * foodData.length)];
        emoji = food.emoji;
        hunger = food.hunger;
        dirt = food.dirt;
        value = 0;
      }
      const x = Math.random() * (areaWidth - size);
      const speed = isFood ? (size / 20) + 1 : (size / 10) + 1; // bigger = faster
      setDrops((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), x, y: 0, size, value, emoji, isFood, hunger, dirt, speed },
      ]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Animate falling drops
  useEffect(() => {
    let animationFrame;
    const update = () => {
      setDrops((prev) => {
        const areaHeight = 400;
        return prev
          .map((d) => ({ ...d, y: d.y + d.speed }))
          .filter((d) => {
            if (d.y < areaHeight) return true;
            if (!d.isFood) {
              setPet((p) => ({ ...p, happiness: Math.max(0, p.happiness - 2) }));
            }
            return false;
          });
      });
      animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const handleCollect = (id, drop) => {
    if (busy) return;

    if (drop.isFood) {
      setPet((p) => ({
        ...p,
        hunger: Math.min(100, p.hunger + drop.hunger),
        cleanliness: Math.max(0, p.cleanliness - drop.dirt),
      }));
    } else {
      setCoins((c) => c + drop.value);
      setPet((p) => ({ ...p, energy: Math.max(0, p.energy - 2) }));
    }
    setXp((x) => {
      const newXp = x + 5;
      if (newXp >= 100) {
        setLevel((lvl) => lvl + 1);
        setPet((p) => ({ ...p, hp: p.hp + Math.floor(p.hp * 0.2) }));
        return 0;
      }
      return newXp;
    });
    setDrops((prev) => prev.filter((d) => d.id !== id));
  };

  const floodBackground = (emoji) => {
    const elements = [];
    for (let i = 0; i < 30; i++) {
      const size = Math.random() * 50 + 20;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      elements.push(
        <div
          key={i + Math.random()}
          className="absolute animate-pop"
          style={{ left: `${x}%`, top: `${y}%`, fontSize: size }}
        >
          {emoji}
        </div>
      );
    }
    return elements;
  };

  const handleAction = (type) => {
    if (busy) return;

    let emoji = "✨";

    if (type === "feed") {
      if (coins < 5) return;
      setCoins((c) => c - 5);
      setPet((prev) => ({ ...prev, hunger: Math.min(100, prev.hunger + 20) }));
      emoji = "🍖";
    }

    if (type === "clean") {
      if (coins < 3) return;
      setCoins((c) => c - 3);
      setPet((prev) => ({ ...prev, cleanliness: Math.min(100, prev.cleanliness + 20) }));
      emoji = "🧼";
    }

    if (type === "play") {
      setBusy("play");
      emoji = "🎾";
      setTimeout(() => {
        setPet((prev) => ({ ...prev, happiness: Math.min(100, prev.happiness + 20) }));
        setBusy("");
      }, 4000);
    }

    if (type === "sleep") {
      setBusy("sleep");
      emoji = "🛏️";
      setDrops([]);
      setTimeout(() => {
        setPet((prev) => ({ ...prev, energy: Math.min(100, prev.energy + 20) }));
        setBusy("");
      }, 5000);
    }

    floodBackground(emoji);
  };

  const restartGame = () => {
    setPet({ hunger: 50, happiness: 50, energy: 50, cleanliness: 50, hp: 100 });
    setCoins(10);
    setBusy("");
    setDrops([]);
    setXp(0);
    setLevel(1);
    setDead(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-purple-100 to-blue-200 select-none">
      <Card ref={gameAreaRef} className="w-full max-w-md h-[400px] p-6 rounded-2xl shadow-xl relative overflow-hidden">
        {dead && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center text-white z-50">
            <p className="text-2xl mb-4">You didn’t care enough for your pet 💔</p>
            <Button onClick={restartGame}>Start Over</Button>
          </div>
        )}

        <CardContent className="flex flex-col gap-4 h-full">
          <div className="flex items-center justify-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-2xl font-bold text-center border-b-2 border-gray-400 bg-transparent focus:outline-none"
            />
            {busy === "sleep" && <span>🛏️</span>}
            {busy === "play" && <span>🎾</span>}
          </div>

          <div className="text-center text-lg">Coins: {coins} 🪙 | Level: {level}</div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button onClick={() => handleAction("feed")} disabled={busy || coins < 5}>🍖 Feed (-5)</Button>
            <Button onClick={() => handleAction("play")} disabled={!!busy}>🎾 Play</Button>
            <Button onClick={() => handleAction("sleep")} disabled={!!busy}>🛏️ Sleep</Button>
            <Button onClick={() => handleAction("clean")} disabled={busy || coins < 3}>🧼 Clean (-3)</Button>
          </div>

          <div className="mt-2 space-y-1 text-sm">
            <p>🍖 Hunger: {pet.hunger}</p>
            <p>🎾 Happiness: {pet.happiness}</p>
            <p>🛏️ Energy: {pet.energy}</p>
            <p>🧼 Cleanliness: {pet.cleanliness}</p>
            <p>❤️ HP: {pet.hp}</p>
          </div>

          <div className="absolute bottom-2 left-0 w-full px-4">
            <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-green-500" style={{ width: `${xp}%` }}></div>
            </div>
            <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${(pet.hp / 100) * 100}%` }}></div>
            </div>
          </div>
        </CardContent>

        {drops.map((d) => (
          <div
            key={d.id}
            onClick={() => handleCollect(d.id, d)}
            className="absolute cursor-pointer flex items-center justify-center select-none hover:scale-110 transition-transform"
            style={{ left: d.x, top: d.y, width: d.size, height: d.size, fontSize: d.size * 0.8 }}
          >
            {d.emoji}
          </div>
        ))}
      </Card>
    </div>
  );
}
