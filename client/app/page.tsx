'use client';

import Lobby from "../components/Lobby";
import Table from "../components/Table";
import { useGame } from "../context/GameContext";

export default function Home() {
  const { gameState } = useGame();

  if (!gameState) {
    return <Lobby />;
  }

  return <Table />;
}
