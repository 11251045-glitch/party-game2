/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ref, 
  set, 
  update, 
  push, 
  remove, 
  onValue, 
  get,
  serverTimestamp
} from "firebase/database";
import { db } from "./firebase";
import { 
  Bomb, 
  Volume2, 
  VolumeX, 
  User, 
  Users, 
  Compass, 
  ExternalLink,
  Copy, 
  Check, 
  Play, 
  LogOut, 
  Send, 
  Radio, 
  AlertTriangle, 
  Sparkles,
  RefreshCw,
  Clock,
  ShieldAlert,
  Cable
} from "lucide-react";

// --- PROCEDURAL AUDIO SYNTHESIZER ---
class SoundEffects {
  static context: AudioContext | null = null;
  static isMuted: boolean = false;

  static init() {
    if (this.isMuted) return;
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  static playTick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.context) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, this.context.currentTime);
      
      gain.gain.setValueAtTime(0.04, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start();
      osc.stop(this.context.currentTime + 0.06);
    } catch (e) {}
  }

  static playAlarmPulse() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.context) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(660, this.context.currentTime);
      
      gain.gain.setValueAtTime(0.06, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start();
      osc.stop(this.context.currentTime + 0.16);
    } catch (e) {}
  }

  static playClick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.context) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, this.context.currentTime); // C4
      gain.gain.setValueAtTime(0.08, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start();
      osc.stop(this.context.currentTime + 0.05);
    } catch (e) {}
  }

  static playEmergency() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.context) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, this.context.currentTime);
      osc.frequency.linearRampToValueAtTime(660, this.context.currentTime + 0.25);
      
      gain.gain.setValueAtTime(0.07, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start();
      osc.stop(this.context.currentTime + 0.3);
    } catch (e) {}
  }

  static playCut() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.context) return;
      const now = this.context.currentTime;
      
      // Short bandpassed white noise burst for snappy mechanical wire cut sound
      const bufferSize = this.context.sampleRate * 0.08; // 80ms duration
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.context.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1500, now);
      
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);
      
      noise.start(now);
      noise.stop(now + 0.08);

      // Add a quick chime alert
      const osc = this.context.createOscillator();
      const oscGain = this.context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      oscGain.gain.setValueAtTime(0.05, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(oscGain);
      oscGain.connect(this.context.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  static playDefuseSuccess() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.context) return;
      const now = this.context.currentTime;
      const scale = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major ascending)
      
      scale.forEach((freq, idx) => {
        const osc = this.context!.createOscillator();
        const gain = this.context!.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        
        osc.connect(gain);
        gain.connect(this.context!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.45);
      });
    } catch (e) {}
  }

  static playExplosion() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.context) return;
      const now = this.context.currentTime;
      
      // White noise buffer
      const bufferSize = this.context.sampleRate * 2.0;
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.context.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(20, now + 1.5);
      
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);
      
      noise.start(now);
      noise.stop(now + 2.0);

      // Low rumble sub osc
      const subOsc = this.context.createOscillator();
      const subGain = this.context.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(90, now);
      subOsc.frequency.linearRampToValueAtTime(10, now + 1.2);
      
      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
      
      subOsc.connect(subGain);
      subGain.connect(this.context.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.3);
    } catch (e) {}
  }
}

// --- DEFINE SCI-FI AGENT NAMES ---
const ADJECTIVES = ["深海", "零度", "幻影", "暴風", "熾焰", "鐵血", "黑星", "星輝", "幽靈", "量子", "脈衝", "鋼鐵"];
const COD_NAMES = ["狐狸", "獵手", "浪人", "先鋒", "遊俠", "核心", "雷霆", "巨獸", "聖徒", "幽浮", "毒蛇", "幻術師"];

function generateAgentName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = COD_NAMES[Math.floor(Math.random() * COD_NAMES.length)];
  const idNum = Math.floor(100 + Math.random() * 900);
  return `${adj}${n}-${idNum}`;
}

// --- DEFINE GAME CONSTANTS ---
const GAME_COLORS = ["red", "blue", "yellow", "green"];

const COLOR_MAP: { [key: string]: { zh: string; hex: string; em: string; shadow: string } } = {
  red: { zh: "紅色線", hex: "#ff003c", em: "🔴", shadow: "shadow-[0_0_25px_rgba(255,0,60,0.4)]" },
  blue: { zh: "藍色線", hex: "#009dff", em: "🔵", shadow: "shadow-[0_0_25px_rgba(0,157,255,0.4)]" },
  yellow: { zh: "黃色線", hex: "#f3ff00", em: "🟡", shadow: "shadow-[0_0_25px_rgba(243,255,0,0.4)]" },
  green: { zh: "綠色線", hex: "#00ff9f", em: "🟢", shadow: "shadow-[0_0_25px_rgba(0,255,159,0.4)]" }
};

// --- DYNAMIC CYBERPUNK RIDDLE GENERATOR ---
function generateSynchronizedRiddle(correctColor: string, hostName: string, playersList: string[]): string {
  const targetZh = COLOR_MAP[correctColor].zh + COLOR_MAP[correctColor].em;
  
  // Roster of templates
  const templates = [
    () => `【系統偏振干涉協議】：\n主控室引力波發射正常，但分流導線偏振發生極化干涉。\n經精算，目前安全線已鎖定為 【${targetZh}】。\n請專家向拆彈手大聲通報剪斷此線！注意，其餘三條線將引發 10,000V 超導短路！`,
    
    () => `【微型融合冷卻協議 - 備註42】：\n當前控制箱過熱！萬一房主「${hostName}」在現場，控制系統判定導線 【${targetZh}】 為電壓分流器安全閥門。\n叫拆彈手立即剪除之，不可遲疑！`,
    
    () => `【反重力模組重啟手冊 - 程式 3C】：\n當前有 ${playersList.length} 位防爆特工已簽到連線。反重力矩陣電離強度偏移指向 【${targetZh}】 為最佳安全搭橋線。\n重複一遍：安全線是 【${targetZh}】，絕對不要剪其他顏色！`,
    
    () => `【AI 情感網絡安全覆載防線】：\n「我的電子羊告訴我，所有能量均已轉移……」\n冷卻核心已將全部回饋阻抗投射在 【${targetZh}】 安全迴路中。請特工發出解鎖口號，速剪此線！`,
    
    () => `【中央主板應急防爆 B7 號指令】：\n防爆安全手冊表示，此炸彈的核心震盪電阻極其不穩定。\n為了平衡中子流，請立即在主控面板上切斷 【${targetZh}】！`,
    
    () => `【太空量子傳送維護日誌】：\n警告！跳躍引擎發生微米爆裂，主分流器外阻斷點處於 【${targetZh}】。\n若能在 60 秒內剪斷此線，將完美鎖定電磁爆。快告訴拆彈手！`
  ];

  const picked = templates[Math.floor(Math.random() * templates.length)];
  return picked();
}

export default function App() {
  // --- PLAYER USER IDENTIFICATION ---
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // --- LOBBY STATE VALUES ---
  const [roomInput, setRoomInput] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [roomState, setRoomState] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  // --- UX AUXILIARY ---
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");
  const [localTimeLeft, setLocalTimeLeft] = useState<number>(60);
  const [isTimeExpiring, setIsTimeExpiring] = useState<boolean>(false);
  const [isCutting, setIsCutting] = useState<string | null>(null);

  // --- REFS ---
  const chatEndRef = useRef<HTMLDivElement>(null);
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- LOAD CRITICAL CREDENTIALS ON MOUNT ---
  useEffect(() => {
    // Check if there is an existing Agent UUID
    let existingId = localStorage.getItem("bomb_defusal_uid");
    if (!existingId) {
      existingId = "agent_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("bomb_defusal_uid", existingId);
    }
    setUserId(existingId);

    // Check if there is a saved Agent Name
    let savedName = localStorage.getItem("bomb_defusal_username");
    if (!savedName) {
      savedName = generateAgentName();
      localStorage.setItem("bomb_defusal_username", savedName);
    }
    setUserName(savedName);

    // Audio volume preference
    const mutedPref = localStorage.getItem("bomb_defusal_muted") === "true";
    setIsMuted(mutedPref);
    SoundEffects.isMuted = mutedPref;

    // Check if there is a active room ID preserved
    const savedRoomId = localStorage.getItem("bomb_defusal_room_id");
    if (savedRoomId) {
      setRoomId(savedRoomId);
    }
  }, []);

  // --- KEEP MUTED STATE SYNCHRONIZED ---
  const toggleMuted = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    SoundEffects.isMuted = nextMute;
    localStorage.setItem("bomb_defusal_muted", String(nextMute));
    SoundEffects.playClick();
  };

  // --- LISTEN TO DATABASE ROOM NODES ---
  useEffect(() => {
    if (!roomId) {
      setRoomState(null);
      return;
    }

    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setRoomState(val);
        
        // Auto rejoin database synchronization
        localStorage.setItem("bomb_defusal_room_id", roomId);
      } else {
        // Room was cleared, return to lobby
        setRoomId("");
        setRoomState(null);
        localStorage.removeItem("bomb_defusal_room_id");
        setErrorMsg("此密室已被關閉或刪除。");
      }
    }, (error) => {
      console.error("Firebase listen failed:", error);
      setErrorMsg("資料庫連線失敗，請稍後再試。");
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  // --- ENSURE PLAYER IS REGISTERED AND DISCIPLINED IN SERVER STATE ON REJOIN/REFRESH ---
  useEffect(() => {
    if (!roomId || !roomState || !userId || !userName) return;
    
    const playersMap = roomState.players || {};
    const exists = !!playersMap[userId];
    
    if (!exists) {
      // Auto register player back into the room players list
      const playerRef = ref(db, `rooms/${roomId}/players/${userId}`);
      const isHost = roomState.hostId === userId;
      set(playerRef, {
        uid: userId,
        name: userName.trim(),
        isHost: isHost,
        joinedAt: Date.now()
      }).then(() => {
        // Post a rejoin system chat notification
        const chatRef = ref(db, `rooms/${roomId}/chats`);
        const newChatRef = push(chatRef);
        set(newChatRef, {
          senderId: "system",
          senderName: "【備用線路】",
          senderRole: "⚡",
          text: `特工 [${userName.trim()}] 重新建立鏈路，成功恢復戰術席位！`,
          timestamp: Date.now()
        });
      }).catch(err => {
        console.error("Auto recover presence failed:", err);
      });
    }
  }, [roomId, roomState, userId, userName]);

  // --- SYNCHRONIZE ACTIVE NAME CHANGES TO ACTIVE ROOM PLAYERS LIST ---
  useEffect(() => {
    if (!roomId || !userId || !userName || !roomState) return;
    const playerInRoom = roomState.players?.[userId];
    if (playerInRoom && playerInRoom.name !== userName.trim()) {
      const playerRef = ref(db, `rooms/${roomId}/players/${userId}/name`);
      set(playerRef, userName.trim()).catch(err => {
        console.error("Failed to sync name change to database room:", err);
      });
    }
  }, [userName, roomId, userId, roomState]);

  // --- RESOLVE GAME STATE SFX SOUND TRIGGERS ---
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomState) {
      prevStatusRef.current = null;
      return;
    }

    const prevStatus = prevStatusRef.current;
    const currentStatus = roomState.status;

    if (currentStatus !== prevStatus) {
      // Avoid playing game start at connection mount if it was already playing,
      // but ensure it plays when transitioning from waiting -> playing
      if (currentStatus === "playing" && prevStatus === "waiting") {
        SoundEffects.playEmergency();
      } else if (currentStatus === "win" && prevStatus === "playing") {
        SoundEffects.playDefuseSuccess();
      } else if (currentStatus === "lose" && prevStatus === "playing") {
        SoundEffects.playExplosion();
      }
    }

    prevStatusRef.current = currentStatus;
  }, [roomState?.status]);

  // --- CLOCK AND SECOND TICK HANDLERS ON GAMEPLAY ---
  useEffect(() => {
    if (!roomState || roomState.status !== "playing") {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
      setIsTimeExpiring(false);
      return;
    }

    // Dynamic timer ticker running locally on each client
    const tickTime = () => {
      if (!roomState.timerStartedAt) return;
      const elapsed = Math.floor((Date.now() - roomState.timerStartedAt) / 1000);
      const computed = Math.max(0, 60 - elapsed);
      setLocalTimeLeft(computed);

      if (computed <= 15) {
        setIsTimeExpiring(true);
        if (computed > 0) {
          SoundEffects.playAlarmPulse();
        }
      } else {
        setIsTimeExpiring(false);
        SoundEffects.playTick();
      }

      // If timer is expired, and status is still playing, trigger fail state
      if (computed === 0 && roomState.status === "playing") {
        clearInterval(localTimerRef.current!);
        localTimerRef.current = null;
        
        // Only host commits the failure change to Firebase to prevent conflicts
        if (userId === roomState.hostId) {
          update(ref(db, `rooms/${roomId}`), {
            status: "lose"
          });
          // Log explosion system chat
          const chatRef = ref(db, `rooms/${roomId}/chats`);
          const newChatRef = push(chatRef);
          set(newChatRef, {
            senderId: "system",
            senderName: "【防禦核心】",
            senderRole: "🔥",
            text: "🚨 警告：60 秒大限已過！冷卻棒完全燒毀，引信已燃起！BOMB DETONATED！",
            timestamp: Date.now()
          });
        }
      }
    };

    tickTime(); // trigger immediately
    localTimerRef.current = setInterval(tickTime, 1000);

    return () => {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
    };
  }, [roomState?.status, roomState?.timerStartedAt, userId, roomId]);

  // --- AUTOMATIC CHAT SMOOTH SCROLLER ---
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomState?.chats]);

  // --- LOBBY ACTIONS ---
  const handleRandomizeName = () => {
    SoundEffects.playClick();
    const newName = generateAgentName();
    setUserName(newName);
    localStorage.setItem("bomb_defusal_username", newName);
    setSuccessMsg(`代號變更為：${newName}`);
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  const handleCreateRoom = async () => {
    SoundEffects.playClick();
    if (!userName.trim()) {
      setErrorMsg("特工代號不能為空！");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    // Generate 5 letter smart room code (BOMB + random num)
    const code = "BM" + Math.floor(100 + Math.random() * 900);

    const initialRoom = {
      id: code,
      status: "waiting",
      hostId: userId,
      createdAt: serverTimestamp(),
      timerStartedAt: null,
      answer: null,
      hintText: null,
      players: {
        [userId]: {
          uid: userId,
          name: userName.trim(),
          isHost: true,
          joinedAt: Date.now()
        }
      },
      chats: {
        welcomeMsg: {
          senderId: "system",
          senderName: "【中央系統】",
          senderRole: "💻",
          text: `密碼防護腔已開啟。安全協議 B7 準備就緒。將代號告訴隊友以加入密室！`,
          timestamp: Date.now()
        }
      }
    };

    try {
      await set(ref(db, `rooms/${code}`), initialRoom);
      setRoomId(code);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("無法創建密室，請重新整理頁面。");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    SoundEffects.playClick();
    if (!userName.trim()) {
      setErrorMsg("特工代號不能為空！");
      return;
    }
    const targetCode = roomInput.trim().toUpperCase();
    if (!targetCode) {
      setErrorMsg("請輸入 5 碼密室編號！");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const snapshot = await get(ref(db, `rooms/${targetCode}`));
      if (!snapshot.exists()) {
        setErrorMsg("找不到該密室編號！請檢查是否輸入錯誤。");
        setLoading(false);
        return;
      }

      const val = snapshot.val();
      
      // Write user to players list
      const playerRef = ref(db, `rooms/${targetCode}/players/${userId}`);
      await set(playerRef, {
        uid: userId,
        name: userName.trim(),
        isHost: false,
        joinedAt: Date.now()
      });

      // Write join chat notice
      const chatRef = ref(db, `rooms/${targetCode}/chats`);
      const newChatRef = push(chatRef);
      await set(newChatRef, {
        senderId: "system",
        senderName: "【安全通訊】",
        senderRole: "⚡",
        text: `特工 [${userName.trim()}] 完成電離校準，已載入防爆控制鏈！`,
        timestamp: Date.now()
      });

      setRoomId(targetCode);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("連線密室失敗，請確認網路與權限。");
    } finally {
      setLoading(false);
    }
  };

  // --- EXIT ROOM ACTIONS ---
  const handleLeaveRoom = async () => {
    SoundEffects.playClick();
    if (!roomId || !roomState) return;

    try {
      const playersList = Object.keys(roomState.players || {});
      
      // Log leaving notice to database chats
      const chatRef = ref(db, `rooms/${roomId}/chats`);
      const newChatRef = push(chatRef);
      await set(newChatRef, {
        senderId: "system",
        senderName: "【安全電路】",
        senderRole: "🔌",
        text: `特工 [${userName}] 已中斷主控台通訊協定！`,
        timestamp: Date.now()
      });

      // Remove player
      await remove(ref(db, `rooms/${roomId}/players/${userId}`));

      if (playersList.length <= 1) {
        // Last player left: wipe room
        await remove(ref(db, `rooms/${roomId}`));
      } else if (userId === roomState.hostId) {
        // Choose next player to be Host
        const nextHostId = playersList.find(k => k !== userId);
        if (nextHostId) {
          await update(ref(db, `rooms/${roomId}`), {
            hostId: nextHostId
          });
          // Re-promote in db user node isHost
          await update(ref(db, `rooms/${roomId}/players/${nextHostId}`), {
            isHost: true
          });
          // Post promoter notification
          const promoChat = push(ref(db, `rooms/${roomId}/chats`));
          await set(promoChat, {
            senderId: "system",
            senderName: "【最高權限】",
            senderRole: "👑",
            text: `原主控離線！主終端控制權已轉移給 [${roomState.players[nextHostId]?.name || "其他特工"}]。`,
            timestamp: Date.now()
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRoomId("");
      localStorage.removeItem("bomb_defusal_room_id");
    }
  };

  // --- START ACTIVE DEPLOY AGREEMENT ---
  const handleStartGame = async () => {
    SoundEffects.playEmergency();
    if (!roomId || !roomState) return;

    const playersCount = Object.keys(roomState.players || {}).length;
    // Solo developer notice is rendered, but allow start for comfortable local testing
    
    // Choose correct wire randomly
    const correctWire = GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)];

    // Choose defuser randomly
    const keys = Object.keys(roomState.players);
    const chosenDefuserId = keys[Math.floor(Math.random() * keys.length)];
    const chosenDefuser = roomState.players[chosenDefuserId];

    const hostPlayerName = roomState.players[roomState.hostId]?.name || "房主";
    const playersNames = Object.values(roomState.players).map((p: any) => p.name);

    // Generate synchronized riddle
    const generatedHint = generateSynchronizedRiddle(correctWire, hostPlayerName, playersNames);

    try {
      const updates: any = {};
      updates["status"] = "playing";
      updates["timerStartedAt"] = Date.now();
      updates["answer"] = correctWire;
      updates["hintText"] = generatedHint;
      updates["defuser"] = {
        uid: chosenDefuserId,
        name: chosenDefuser.name
      };

      await update(ref(db, `rooms/${roomId}`), updates);

      // System notification
      const chatRef = ref(db, `rooms/${roomId}/chats`);
      const newChatRef = push(chatRef);
      await set(newChatRef, {
        senderId: "system",
        senderName: "【安全指揮中心】",
        senderRole: "🚨",
        text: `⚡ 防爆演練警報啟動！[${chosenDefuser.name}] 被隨機指派為《拆彈特工》！全體密碼專家請立即破解提示，引導他剪對電線！計時 60 秒開始！`,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Start game failed", err);
      setErrorMsg("發送啟動指令失敗，請重試。");
    }
  };

  // --- CUT WIRE DECISION (ONLY DEFUSER CAN CLICK) ---
  const handleCutWire = async (color: string) => {
    if (!roomId || !roomState || roomState.status !== "playing") return;
    
    // Verify if player is indeed the defuser
    if (userId !== roomState.defuser?.uid) return;

    SoundEffects.playCut();
    setIsCutting(color);

    const isSuccess = color === roomState.answer;
    
    setTimeout(async () => {
      try {
        const nextStatus = isSuccess ? "win" : "lose";
        
        await update(ref(db, `rooms/${roomId}`), {
          status: nextStatus
        });

        // Add action notice
        const chatRef = ref(db, `rooms/${roomId}/chats`);
        const newChatRef = push(chatRef);
        await set(newChatRef, {
          senderId: userId,
          senderName: userName,
          senderRole: "✂️",
          text: `大膽剪下了【${COLOR_MAP[color].zh}】！${isSuccess ? "🟢 任務成功！信號阻斷器已中斷化學雷管膨脹！萬物得救。" : "🔴 轟！！！化學核心連鎖爆裂！大限降臨。"}`,
          timestamp: Date.now()
        });

        setIsCutting(null);
      } catch (err) {
        console.error("Cut wire failed", err);
        setIsCutting(null);
      }
    }, 1200); // 1.2s drama delay for intense cut reaction!
  };

  // --- RESTART GAME / PLAY AGAIN ---
  const handleRestartGame = async () => {
    SoundEffects.playClick();
    if (!roomId) return;

    try {
      await update(ref(db, `rooms/${roomId}`), {
        status: "waiting",
        defuser: null,
        answer: null,
        hintText: null,
        timerStartedAt: null,
        timeLeft: 60
      });

      // Append clean log
      const chatRef = ref(db, `rooms/${roomId}/chats`);
      const newChatRef = push(chatRef);
      await set(newChatRef, {
        senderId: "system",
        senderName: "【安全通訊】",
        senderRole: "🔄",
        text: "防爆主板已重設！全新電阻防護罩校準，準備開始下一輪演練。",
        timestamp: Date.now()
      });
    } catch (e) {
      console.error(e);
    }
  };

  // --- SEND CHAT ACTION ---
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !roomId || !roomState) return;

    SoundEffects.playClick();
    
    // Determine player badge
    let roleText = "【專家】";
    if (roomState.status === "playing") {
      roleText = userId === roomState.defuser?.uid ? "【拆彈手】" : "【專家】";
    }

    try {
      const chatRef = ref(db, `rooms/${roomId}/chats`);
      const newChat = push(chatRef);
      set(newChat, {
        senderId: userId,
        senderName: userName,
        senderRole: roleText,
        text: chatInput.trim(),
        timestamp: Date.now()
      });
      setChatInput("");
    } catch (err) {
      console.error("Chat send error", err);
    }
  };

  // --- CLIPBOARD ROOM ID SHARER ---
  const handleCopyRoomId = () => {
    SoundEffects.playClick();
    if (!roomId) return;
    navigator.clipboard.writeText(roomId).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // --- RENDER SCREEN DECISIONS ---
  const players = roomState ? Object.values(roomState.players || {}) : [];
  const amIHost = roomState && roomState.hostId === userId;
  const inRoom = !!roomState;

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#00ff9f] flex flex-col font-mono selection:bg-[#00ff9f] selection:text-black overflow-x-hidden border-4 border-[#1a1a1a] shadow-[inset_0_0_100px_rgba(0,255,159,0.1)]">
      
      {/* CRT Scanline styling effect */}
      <div className="crt-scanline"></div>

      {/* HEADER SECTION - Top HUD Bar */}
      <header className="border-b-2 border-[#00ff9f] bg-[#050505] px-6 py-4 sticky top-0 z-40 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">系統運作狀態</div>
          <div className="text-xl md:text-2xl font-bold flex items-center gap-3">
            <span className="w-3 h-3 bg-[#00ff9f] rounded-full animate-pulse"></span>
            加密防護安全通道已啟用 // 房號: <span className="text-[#f3ff00]">{roomId ? roomId : "中央大廳"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">協同拆彈分流主網絡</div>
            <div className="text-sm md:text-md text-[#00f0ff] font-bold">線上即時操作介面</div>
          </div>

          {/* Sound FX Switcher */}
          <button 
            onClick={toggleMuted}
            className={`px-3 py-1.5 border rounded-none transition-all duration-300 flex items-center gap-1.5 cursor-pointer text-xs uppercase font-bold tracking-tighter ${
              isMuted 
                ? "bg-black border-[#ff003c]/50 text-[#ff003c] hover:opacity-85" 
                : "bg-[#00ff9f]/10 border-[#00ff9f] text-[#00ff9f] hover:-translate-y-0.5"
            }`}
            title={isMuted ? "已靜音" : "音效執行中"}
            id="audio-toggle-btn"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#ff003c]" /> : <Volume2 className="w-4 h-4 text-[#00ff9f]" />}
            <span>{isMuted ? "靜音中" : "音效隨開"}</span>
          </button>
        </div>
      </header>

      {/* MAIN SCREEN ROUTER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col justify-center relative">
        <AnimatePresence mode="wait">
          
          {/* LOBBY ENTRY SCREEN */}
          {!inRoom && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md w-full mx-auto"
            >
              {/* BRAND CARD HOVER */}
              <div className="bg-[#0a0a0a] border-2 border-[#00ff9f] p-8 rounded-sm relative overflow-hidden shadow-[0_0_50px_rgba(0,255,159,0.15)] font-mono">
                
                {/* Tech Accent Lines */}
                <div className="absolute top-0 left-0 w-8 h-[2px] bg-[#00ff9f]"></div>
                <div className="absolute top-0 left-0 w-[2px] h-8 bg-[#00ff9f]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-[#ff003c]"></div>
                <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-[#ff003c]"></div>

                <div className="text-center mb-6">
                  <div className="inline-block p-4 bg-[#ff003c]/10 rounded-sm mb-3 text-[#ff003c] border border-[#ff003c]/20">
                    <Cable className="w-10 h-10 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-bold tracking-widest text-[#00ff9f] futuristic-font neon-text-green uppercase">特工安全終端 v1.5</h2>
                  <p className="text-xs text-[#00f0ff] mt-1 tracking-tighter opacity-75">// 雙人協同拆彈分流安全協議</p>
                </div>

                {/* ERROR PANEL */}
                {errorMsg && (
                  <div className="mb-4 p-3.5 bg-[#050505] border-2 border-[#ff003c] rounded-none text-[#ff003c] text-xs flex items-start gap-2 shadow-[0_0_15px_rgba(255,0,60,0.2)]">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#ff003c] mt-0.5" />
                    <span className="font-bold tracking-tight">{errorMsg}</span>
                  </div>
                )}

                {/* SUCCESS NOTIFICATION */}
                {successMsg && (
                  <div className="mb-4 p-3.5 bg-[#050505] border-2 border-[#00ff9f] rounded-none text-[#00ff9f] text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,159,0.2)]">
                    <Sparkles className="w-4 h-4 text-[#00ff9f]" />
                    <span className="font-bold tracking-tight">{successMsg}</span>
                  </div>
                )}

                {/* VISUAL CONTROLS */}
                <div className="space-y-4">
                  {/* ALIAS INPUT */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#00ff9f] mb-1.5 flex items-center justify-between">
                      <span>👤 特工防爆代號 [臨時代號]</span>
                      <button 
                        onClick={handleRandomizeName}
                        className="text-[10px] text-[#f3ff00] hover:underline flex items-center gap-1 cursor-pointer"
                        id="rand-name-btn"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> 隨機生成
                      </button>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={userName}
                        onChange={(e) => {
                          setUserName(e.target.value);
                          localStorage.setItem("bomb_defusal_username", e.target.value);
                        }}
                        placeholder="請輸入特工名稱"
                        maxLength={15}
                        className="w-full bg-[#111111] border-2 border-[#1a1a1a] focus:border-[#00ff9f] px-4 py-2.5 rounded-none text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00ff9f]/50 font-medium tracking-wide transition-all"
                        id="user-name-input"
                      />
                      <User className="absolute right-3 top-3 w-4 h-4 text-[#00ff9f]/40" />
                    </div>
                  </div>

                  {/* SPLIT HORIZONTAL ACTIONS */}
                  <div className="border-t border-[#1a1a1a] pt-4 mt-6 space-y-4">
                    {/* BUTTON A: HOST NEW ROOM */}
                    <button
                      onClick={handleCreateRoom}
                      disabled={loading}
                      className="w-full relative group cursor-pointer overflow-hidden border-2 border-[#00ff9f] p-3 rounded-none bg-[#00ff9f]/10 hover:bg-[#00ff9f]/20 text-[#00ff9f] hover:text-white font-bold tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-2"
                      id="create-room-btn"
                    >
                      <Sparkles className="w-4 h-4 text-[#00ff9f] group-hover:scale-125 transition-transform" />
                      <span>✦ 建立全新拆彈分流密室 (主控)</span>
                      <div className="absolute top-0 right-0 p-0.5 bg-[#00ff9f] text-[9px] font-mono text-black px-1.5 uppercase font-bold tracking-tighter">房主</div>
                    </button>

                    {/* HORIZONTAL IN-BETWEEN LINE */}
                    <div className="flex items-center gap-2 my-2">
                      <div className="h-[2px] bg-[#1a1a1a] flex-1"></div>
                      <span className="text-[10px] text-[#00ff9f]/40 font-mono tracking-widest">或</span>
                      <div className="h-[2px] bg-[#1a1a1a] flex-1"></div>
                    </div>

                    {/* INPUT SECTION B: JOIN CODE */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={roomInput}
                        onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                        placeholder="房號 (例如: BM406)"
                        maxLength={15}
                        className="flex-1 bg-[#111111] border-2 border-[#1a1a1a] focus:border-[#00f0ff] px-3 py-2 rounded-none text-zinc-100 text-sm focus:outline-none tracking-widest text-center"
                        id="room-input"
                      />
                      <button
                        onClick={handleJoinRoom}
                        disabled={loading}
                        className="bg-[#00f0ff] hover:opacity-90 active:translate-y-0.5 text-black px-4 py-2 rounded-none text-xs font-bold tracking-widest transition-all cursor-pointer flex items-center gap-2"
                        id="join-room-btn"
                      >
                        <Compass className="w-4 h-4" />
                        <span>聯接房號</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#1a1a1a] text-center">
                  <p className="text-[10px] text-[#00ff9f]/50 leading-relaxed font-mono">
                    💡 使用說明：本遊戲至少需要一名「拆彈手」和一名「專家」合作。在開分頁或傳房號給好友連線測試！
                  </p>
                </div>

              </div>
            </motion.div>
          )}

          {/* ACTIVE GAME OVERLAYS AND SCREENS */}
          {inRoom && roomState && (
            <motion.div 
              key="gameplay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:grid lg:grid-cols-12 gap-6 w-full"
            >
              {/* COLUMN A: GAME SYSTEM PANEL (7/12 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-4 mb-4 lg:mb-0">
                
                {/* STATUS BAR BAR & EXIT TOOLBAR */}
                <div className="bg-[#0a0a0a] border-2 border-[#00ff9f] px-5 py-3 rounded-none flex items-center justify-between shadow-[0_0_25px_rgba(0,255,159,0.1)]">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00ff9f] animate-pulse"></span>
                    <span className="text-[#00ff9f]/70 font-bold uppercase tracking-wider">安全解密頻道:</span>
                    <span className="bg-black border border-[#00ff9f] px-3 py-1 rounded-none text-[#f3ff00] tracking-widest font-black text-sm flex items-center gap-1.5 shadow-[inset_0_0_10px_rgba(0,255,159,0.1)]">
                      #{roomId}
                      <button 
                        onClick={handleCopyRoomId}
                        className="p-1 hover:bg-[#00ff9f]/25 rounded transition-colors text-[#00ff9f] cursor-pointer"
                        title="複製房號至剪貼簿"
                        id="copy-room-id-btn"
                      >
                        {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </span>
                    {copySuccess && <span className="text-[#00ff9f] font-mono text-[10px] animate-pulse">房號已複製</span>}
                  </div>

                  <button 
                    onClick={handleLeaveRoom}
                    className="text-xs text-[#ff003c] border-2 border-[#ff003c] bg-black hover:bg-[#ff003c] hover:text-black hover:shadow-[0_0_15px_rgba(255,0,60,0.3)] px-4 py-2 transition-all flex items-center gap-1.5 cursor-pointer font-bold tracking-widest uppercase rounded-none"
                    id="leave-room-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>中止任務退出</span>
                  </button>
                </div>

                {/* VIEW A: LOBBY WAITING SCREEN */}
                {roomState.status === "waiting" && (
                  <div className="relative bg-[#0a0a0a] border-2 border-[#f3ff00] p-6 rounded-none shadow-[0_0_30px_rgba(243,255,0,0.15)] flex-grow flex flex-col justify-between min-h-[400px]">
                    
                    {/* Floating identification title */}
                    <div className="absolute -top-3 left-4 bg-[#f3ff00] text-black px-3 py-1 text-xs font-black uppercase italic tracking-wider">戰術準備大廳</div>

                    <div>
                      <div className="flex items-center justify-between border-b border-[#f3ff00]/30 pb-3 mb-5 mt-2">
                        <h3 className="text-md font-black tracking-widest text-[#f3ff00] flex items-center gap-2 uppercase">
                          <Users className="w-5 h-5 text-[#f3ff00]" />
                          當前小組特工 ({players.length} / 08 人)
                        </h3>
                        <span className="text-[10px] text-[#00ff9f] font-mono tracking-widest blink">即時安全偵測中</span>
                      </div>

                      {/* AGENT TILES ROSTER */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {players.map((p: any) => (
                          <div 
                            key={p.uid}
                            className={`p-3 rounded-none border-2 flex items-center justify-between tracking-widest transition-all ${
                              p.uid === userId 
                                ? "bg-black border-[#ff003c] text-[#ff003c] shadow-[0_0_15px_rgba(255,0,60,0.15)]" 
                                : "bg-[#111111] border-[#1a1a1a] text-[#00ff9f]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${p.uid === userId ? "bg-[#ff003c]" : "bg-[#00ff9f] animate-pulse"}`}></span>
                              <span className="text-sm font-bold uppercase">{p.name}</span>
                              {p.uid === userId && <span className="text-[9px] text-[#ff003c] border border-[#ff003c]/40 px-1 bg-[#ff003c]/10 uppercase font-bold tracking-tighter">您</span>}
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              {p.uid === roomState.hostId && (
                                <span className="text-[9px] px-2 py-0.5 bg-[#f3ff00] text-black font-black uppercase tracking-tighter">房主 🔑</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* INSTRUCTIONS MEMO BOARD */}
                      <div className="bg-[#111111] border-2 border-[#1a1a1a] p-5 rounded-none text-xs text-[#00ff9f]/80 leading-relaxed mb-4 font-sans">
                        <h4 className="text-white font-black mb-2 flex items-center gap-1.5 uppercase tracking-widest font-mono text-sm">
                          <AlertTriangle className="w-4 h-4 text-[#f3ff00]" /> 
                          拆彈分流協議安全指引 //
                        </h4>
                        <ol className="list-decimal list-inside space-y-1.5 text-[#00ff9f]">
                          <li>系統將隨機指派一名特工為 <strong className="text-[#ff003c]">《拆彈主手》</strong>，其餘特工全數為 <strong className="text-[#00f0ff]">《密碼分析專家》</strong>。</li>
                          <li><strong className="text-[#ff003c]">拆彈主手碼表</strong>：畫面會顯示一組正在瘋狂倒計時 60 秒的電阻中繼器與彩色分流導線按鈕，但沒有密語線索提示，只能聽從指揮。</li>
                          <li><strong className="text-[#00f0ff]">分析專家解密</strong>：畫面上會看見精密的通訊解密規律，但看不到計時器、也無權點擊任何導線。</li>
                          <li>雙方利用 <strong className="text-[#00ff9f] underline">下方安全頻道</strong> 互相對照通報，引導拆彈主手在時間耗盡前將安全的那條導線剪斷！</li>
                        </ol>
                      </div>

                      {players.length === 1 && (
                        <div className="mt-4 p-3 bg-black border-2 border-[#00f0ff] rounded-none text-[11px] text-[#00f0ff] font-sans">
                          ⚡ <strong className="uppercase text-[#f3ff00]">獨行沙盒演練：</strong>將本密室號 <b className="text-white underline font-black">{roomId}</b> 分享或貼到另一無痕視窗/手機，即可一人同時扮演兩個角色，體會實時通訊同步的樂趣！
                        </div>
                      )}
                    </div>

                      {/* START CONTROLS BLOCK FOR HOST */}
                      <div className="border-t-2 border-[#1a1a1a] pt-5 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-[#00ff9f]/75 uppercase tracking-wider select-none font-mono">
                          {amIHost 
                            ? "🛡️ 房主主控權限制定完成。隨時可以開始。" 
                            : "🛰️ 隊伍待命中... 正在等待置頂房主發送啟動指令。"
                          }
                        </div>

                        {amIHost ? (
                          <button
                            onClick={handleStartGame}
                            className="w-full sm:w-auto px-8 py-3.5 bg-[#f3ff00] text-black font-black text-xs uppercase tracking-widest hover:opacity-95 active:translate-y-0.5 transition-all shadow-[0_0_20px_rgba(243,255,0,0.3)] cursor-pointer rounded-none flex items-center justify-center gap-2"
                            id="start-game-btn"
                          >
                            <Play className="w-4 h-4 text-black fill-black" />
                            <span>🚀 啟動分流防爆協議</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 text-[#00f0ff] font-mono text-xs uppercase tracking-widest animate-pulse font-bold">
                            <span className="w-2.5 h-2.5 bg-[#00f0ff] rounded-full animate-ping"></span>
                            <span>系統待命</span>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                {/* VIEW B1: DEFUSER INTENSE HUD SCREEN */}
                {roomState.status === "playing" && userId === roomState.defuser?.uid && (
                  <div className="bg-[#0a0a0a] border-2 border-[#ff003c] p-6 rounded-none relative overflow-hidden flex-grow flex flex-col justify-between shadow-[0_0_30px_rgba(255,0,60,0.15)] min-h-[400px]">
                    
                    {/* Glowing Danger Top Line */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-[#ff003c]"></div>

                    {/* DANGER FLASH HUD WATERMARK */}
                    <div className="absolute inset-0 bg-[#ff003c]/5 pointer-events-none animate-pulse"></div>

                    <div>
                      {/* ROLE IDENTIFIER HEADER */}
                      <div className="flex items-center justify-between border-b border-[#ff003c]/30 pb-3 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 bg-[#ff003c]/15 border border-[#ff003c]/50 rounded-none text-[9px] font-mono text-[#ff003c] uppercase font-bold tracking-widest animate-pulse">
                            身分 // 拆彈特工
                          </div>
                          <h3 className="text-md font-bold tracking-wider text-[#ff003c] futuristic-font flex items-center gap-1.5 uppercase">
                            👑 拆彈特工控制台 (您的回合)
                          </h3>
                        </div>
                        <span className="text-[10px] text-[#00ff9f]/50 font-mono">主機存取權：部分限制</span>
                      </div>

                      {/* INTENSE DOUBLE TIMERS MODULE */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        
                        {/* TIMER DISPLAY */}
                        <div className={`md:col-span-2 p-4 border-2 rounded-none relative flex flex-col items-center justify-center ${
                          isTimeExpiring 
                            ? "border-[#ff003c] bg-black shadow-[0_0_20px_rgba(255,0,60,0.3)]" 
                            : "border-[#f3ff00]/60 bg-black"
                        }`}>
                          <div className="absolute top-1.5 left-2.5 text-[8px] font-mono uppercase text-[#00ff9f]/60 tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 熔絲計量壓力值
                          </div>
                          <div className={`text-4xl md:text-5xl font-black tracking-widest digital-font my-2 ${
                            isTimeExpiring ? "text-[#ff003c]" : "text-[#f3ff00]"
                          }`}>
                            {localTimeLeft}
                            <span className="text-sm font-mono tracking-tighter ml-1">.00 秒</span>
                          </div>
                          <div className="text-[10px] font-mono tracking-wider">
                            {isTimeExpiring ? "🔥 警告：化學引信臨界高溫壓縮！" : "⏳ 引信安全暫態穩定中"}
                          </div>
                        </div>

                        {/* DISCONNECTED BLIND NOTICE */}
                        <div className="p-3.5 border-2 border-[#ff003c]/30 bg-black rounded-none flex flex-col justify-center text-center">
                          <div className="text-[#ff003c] font-bold text-xs uppercase mb-1 flex items-center justify-center gap-1">
                            <ShieldAlert className="w-4 h-4 text-[#ff003c]" />
                            遮蔽保護啟動
                          </div>
                          <p className="text-[10px] text-[#00ff9f]/70 leading-normal">
                            🔒 專家解鎖線索已被隔絕。<br />您看得到導線但沒有任何提示！請透過通訊欄詢問專家隊友！
                          </p>
                        </div>
                      </div>

                      {/* MAIN HARNESS: Hang down vertical wires */}
                      <div className="border-2 border-[#1a1a1a] bg-[#050505] p-5 rounded-none relative overflow-hidden mb-6">
                        <div className="text-center mb-4">
                          <span className="text-[10px] font-mono text-[#00ff9f]/60 uppercase tracking-widest">
                            {isCutting ? "⚡ 剪線電磁振盪導通... 信號阻斷切斷中..." : "✂️ 物理安全閘口：點擊剪斷以下任一根色彩導線（四條精密控制通道）"}
                          </span>
                        </div>

                        {/* Interactive Vertical wire wires */}
                        <div className="grid grid-cols-4 gap-4 h-48 max-w-md mx-auto items-stretch relative">
                          {GAME_COLORS.map((c) => {
                            const config = COLOR_MAP[c];
                            const isBeingCut = isCutting === c;
                            const isOtherCut = isCutting && isCutting !== c;

                            return (
                              <button
                                key={c}
                                disabled={!!isCutting}
                                onClick={() => handleCutWire(c)}
                                className={`group relative flex flex-col items-center justify-between py-2 transition-all duration-300 rounded-none overflow-hidden cursor-pointer ${
                                  isBeingCut ? "bg-[#111] brightness-125 scale-95" : "hover:bg-[#111]"
                                } ${isOtherCut ? "opacity-30 scale-95" : "opacity-100"}`}
                              >
                                {/* Cable hanger cap */}
                                <div className="w-6 h-3 bg-[#111] border-b-2 border-black rounded-sm shadow-md"></div>
                                
                                {/* Vertical Cable Line */}
                                <div 
                                  className="w-1.5 flex-1 transition-all duration-150 relative"
                                  style={{ backgroundColor: config.hex }}
                                >
                                  {/* Wire glow */}
                                  <div className="absolute inset-x-[-3px] top-0 bottom-0 opacity-60 rounded-full" style={{ backgroundColor: config.hex, filter: 'blur(3px)' }}></div>

                                  {/* Cut visualization */}
                                  {isBeingCut && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black p-1 border border-[#ff003c] rotate-45 rounded-none z-30 font-sans">
                                      <span className="block text-[8px] text-[#ff003c] font-black uppercase animate-ping">已剪斷</span>
                                    </div>
                                  )}
                                </div>

                                {/* Bottom label */}
                                <span className="text-[10px] font-bold py-1 px-1.5 border border-black rounded-none bg-black tracking-widest text-[#00ff9f]">
                                  {config.zh}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#ff003c]/80 text-center uppercase tracking-[0.2em] border-t border-[#1a1a1a] pt-3 font-bold font-sans">
                      ⚡ 警報：極限精密防爆體系。任何的一發失誤均會直接引爆中繼化學核心。
                    </div>

                  </div>
                )}

                {/* VIEW B2: EXPERT CRT DEVIANCE TERMINAL */}
                {roomState.status === "playing" && userId !== roomState.defuser?.uid && (
                  <div className="bg-[#0a0a0a] border-2 border-[#00f0ff] p-6 rounded-none relative overflow-hidden flex-grow flex flex-col justify-between shadow-[0_0_30px_rgba(0,240,255,0.15)] min-h-[400px]">
                    
                    {/* Glowing Tech Top Green Line */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-[#00f0ff]"></div>

                    {/* Cyber Ambient Grid Overlay */}
                    <div className="absolute inset-0 bg-[#00f0ff]/5 pointer-events-none"></div>

                    <div>
                      {/* ROLE IDENTIFIER HEADER */}
                      <div className="flex items-center justify-between border-b border-[#00f0ff]/30 pb-3 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 bg-[#00f0ff]/15 border border-[#00f0ff]/50 rounded-none text-[9px] font-mono text-[#00f0ff] uppercase font-bold tracking-widest">
                            身分 // 密碼專家
                          </div>
                          <h3 className="text-md font-bold tracking-wider text-[#00f0ff] futuristic-font flex items-center gap-1.5 uppercase">
                            📟 密碼專家主控制台 (DECODING ADVISORY)
                          </h3>
                        </div>
                        <span className="text-[10px] text-[#00ff9f]/50 font-mono">MATRIX ACCESS: FULL DECRYPT</span>
                      </div>

                      {/* IMPORTANT NOTIFICATION EXCLUDING TIME */}
                      <div className="mb-5 p-3.5 bg-black border-2 border-[#1a1a1a] rounded-none flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-[#00f0ff] shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-xs font-black text-[#00f0ff] uppercase tracking-widest">// SECURED WARNING COMPLIANCE PROTOCOL //</span>
                          <p className="text-[11px] text-[#00ff9f]/80 leading-normal mt-1">
                            防爆專家<b>無法</b>看見倒數計時與剪線按鈕！請大聲將屏幕下方的<b>安全密語線索</b>，在下方文字通信欄狂發，或用語音語音通報給拆彈手 <b>【{roomState.defuser?.name}】</b>！
                          </p>
                        </div>
                      </div>

                      {/* DISPLAY OF DYNAMIC SYNCHRONIZED RIDDLE CARD FROM DB */}
                      <div className="border-2 border-[#00ff9f] bg-black p-6 rounded-none mb-6 relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,255,159,0.1)]">
                        <div className="absolute top-1 left-2 text-[8px] font-mono text-[#00ff9f]/60 uppercase tracking-widest flex items-center gap-1">
                          <Radio className="w-3.5 h-3.5 animate-pulse" /> 解密安全規律分析中...
                        </div>
                        
                        <div className="text-center font-bold text-sm md:text-base text-white font-mono leading-relaxed whitespace-pre-line mt-4 mb-2">
                          {roomState.hintText || "【通訊建立中，請回饋通訊埠...】"}
                        </div>

                        {/* SCANLINE BLIP GRAPHS */}
                        <div className="flex gap-2 justify-center py-2 opacity-55 text-[10px]">
                          <span className="font-mono text-[#00ff9f]">高敏感解密：100%</span>
                          <span className="font-mono text-[#00ff9f]/40">|</span>
                          <span className="font-mono text-[#f3ff00]">信號識別：已同步加密</span>
                        </div>
                      </div>
                    </div>

                    {/* ROLE LISTS */}
                    <div className="bg-[#111111] p-3.5 border-2 border-[#1a1a1a] rounded-none flex flex-wrap items-center justify-between text-xs text-[#00ff9f] gap-2 font-sans">
                      <div>
                        <span>🎯 拆彈先鋒特工：</span>
                        <span className="text-[#ff003c] font-black bg-black border border-[#ff003c] px-3 py-1 ml-2 font-mono tracking-wider">
                          {roomState.defuser?.name}
                        </span>
                      </div>

                      <div className="text-[10px] text-[#00ff9f]/60 uppercase tracking-tighter">
                        * 註：拆彈現場的高溫高壓雷管正以 1Hz 速率劇烈流逝！
                      </div>
                    </div>

                  </div>
                )}

                {/* VIEW C1: SUCCESS WIN SCREEN BLOCK */}
                {roomState.status === "win" && (
                  <div className="bg-[#0a0a0a] border-2 border-[#00ff9f] p-8 rounded-none relative overflow-hidden flex-grow flex flex-col justify-center items-center text-center shadow-[0_0_50px_rgba(0,255,159,0.25)] min-h-[400px]">
                    
                    {/* Tech corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00ff9f]"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00ff9f]"></div>

                    <div className="p-4 bg-[#00ff9f]/10 rounded-none text-[#00ff9f] border border-[#00ff9f]/30 mb-4 animate-bounce">
                      <Sparkles className="w-12 h-12" />
                    </div>

                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-widest text-[#00ff9f] futuristic-font uppercase mb-2 font-sans">
                      🟢 阻斷成功 - 危機完全排除
                    </h2>
                    <h3 className="text-lg text-[#00ff9f] font-bold mb-4 font-mono">// 任務解密成功 // 炸彈危機解除</h3>

                    <p className="max-w-md text-xs text-[#00ff9f]/85 leading-normal mb-8 leading-relaxed font-sans">
                      全體特工生還！在拆彈手 <b>【{roomState.defuser?.name}】</b> 的精準決心與專家的安全引導下，電解電路已在融毀前 0.05ms 精確冷卻阻斷。
                    </p>

                    {/* HOST CAN INITIATE PLAY AGAIN */}
                    {amIHost ? (
                      <button
                        onClick={handleRestartGame}
                        className="px-8 py-3.5 bg-[#00ff9f] text-black font-black text-sm tracking-widest hover:opacity-90 active:translate-y-0.5 rounded-none shadow-[0_0_20px_rgba(0,255,159,0.3)] cursor-pointer flex items-center gap-2 uppercase transition-all"
                        id="play-again-btn"
                      >
                        <RefreshCw className="w-4 h-4 text-black animate-spin-slow" />
                        <span>重新啟動另一場演練儀</span>
                      </button>
                    ) : (
                      <div className="text-xs text-[#00ff9f] flex items-center gap-2 font-mono uppercase tracking-widest">
                        <div className="w-4 h-4 border-2 border-[#00ff9f] border-t-transparent rounded-full animate-spin"></div>
                        <span>正在等待房主特工重新啟動模擬系統...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW C2: INTENSE LOSE RED FLARE SCREEN */}
                {roomState.status === "lose" && (
                  <div className="bg-[#0a0a0a] border-2 border-[#ff003c] p-8 rounded-none relative overflow-hidden flex-grow flex flex-col justify-center items-center text-center shadow-[0_0_50px_rgba(255,0,60,0.25)] min-h-[400px]">
                    
                    {/* Tech corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#ff003c]"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#ff003c]"></div>

                    <div className="p-4 bg-[#ff003c]/10 rounded-none text-[#ff003c] border border-[#ff003c]/30 mb-4">
                      <AlertTriangle className="w-12 h-12 text-[#ff003c] animate-ping" />
                    </div>

                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-widest text-[#ff003c] futuristic-font uppercase mb-2 font-sans">
                      ☣️ 化學引信烈焰爆炸
                    </h2>
                    <h3 className="text-lg text-[#ff003c] font-bold mb-4 font-mono">// 熔融核心破裂 // 炸彈已引爆</h3>

                    <p className="max-w-md text-xs text-[#00ff9f]/80 leading-relaxed mb-8 font-mono">
                      裂變雷管過載。電磁隔絕器已損毀，化學波包流在零界点發生坍縮爆炸。團隊已被極高溫離子流蒸發。請優化戰術！
                    </p>

                    {/* HOST CAN INITIATE REBOOT */}
                    {amIHost ? (
                      <button
                        onClick={handleRestartGame}
                        className="px-8 py-3.5 bg-[#ff003c] text-black font-black text-sm tracking-widest hover:opacity-90 active:translate-y-0.5 rounded-none shadow-[0_0_20px_rgba(255,0,60,0.3)] cursor-pointer flex items-center gap-2 uppercase transition-all"
                        id="retry-btn"
                      >
                        <RefreshCw className="w-4 h-4 text-black animate-spin-slow" />
                        <span>💾 重新建立防爆中繼架構</span>
                      </button>
                    ) : (
                      <div className="text-xs text-[#ff003c] flex items-center gap-2 font-mono uppercase tracking-widest">
                        <div className="w-4 h-4 border-2 border-[#ff003c] border-t-transparent rounded-full animate-spin"></div>
                        <span>正在等待房主特工重新配置防爆模擬矩陣...</span>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* COLUMN B: MULTIPLAYER CYBER CHAT COMM (4/12 Cols) */}
              <div className="lg:col-span-4 flex flex-col h-[500px] lg:h-[calc(100vh-140px)] min-h-[400px] max-h-[700px] bg-[#0a0a0a] border-2 border-[#00f0ff] rounded-none shadow-[0_0_25px_rgba(0,240,255,0.1)] relative">
                
                {/* Micro tech line */}
                <div className="absolute top-0 inset-x-0 h-[3px] bg-[#00f0ff]"></div>

                {/* COMM HEADER */}
                <div className="p-3.5 bg-black border-b-2 border-[#00f0ff]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#00f0ff] animate-pulse" />
                    <span className="text-xs font-black tracking-widest text-[#00f0ff] font-mono uppercase">戰術安全通訊流 (機密防護)</span>
                  </div>
                  <span className="text-[9px] text-[#00f0ff]/50 font-mono">主機探針：已連線監測</span>
                </div>

                {/* SCROLLABLE CHAT MESSAGES PORT */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col scrollbar-custom">
                  {roomState.chats ? (
                    Object.entries(roomState.chats).map(([key, chat]: [string, any]) => {
                      const isSystem = chat.senderId === "system";
                      const isMe = chat.senderId === userId;

                      return (
                        <div 
                          key={key} 
                          className={`flex flex-col max-w-[85%] ${
                            isSystem 
                              ? "mx-auto w-full text-center" 
                              : isMe 
                                ? "self-end items-end" 
                                : "self-start items-start"
                          }`}
                        >
                          {/* Sender identity */}
                          {!isSystem && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[#00f0ff]/70 mb-0.5 font-mono">
                              <span className="font-bold">{chat.senderName}</span>
                              <span className="text-[8.5px] text-[#00ff9f] font-mono bg-[#00ff9f]/10 border border-[#00ff9f]/20 px-1 rounded-none uppercase font-bold">
                                {chat.senderRole || "特工"}
                              </span>
                            </div>
                          )}

                          {/* Text bubble */}
                          <div className={`p-2.5 rounded-none text-xs leading-relaxed break-words font-mono ${
                            isSystem 
                              ? "bg-black border border-[#1a1a1a] py-1.5 text-[#00ff9f]/50 font-mono italic" 
                              : isMe 
                                ? "bg-[#ff003c]/10 border border-[#ff003c]/40 text-[#ff003c]" 
                                : "bg-[#00f0ff]/5 border border-[#00f0ff]/40 text-[#00f0ff]"
                          }`}>
                            {chat.text}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-[#00f0ff]/40 text-xs my-auto italic tracking-widest uppercase font-sans">
                      當前防爆通訊頻道訊號安靜
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* CHAT ENTRY BOX */}
                <form 
                  onSubmit={handleSendChat}
                  className="p-2 bg-black border-t-2 border-[#1a1a1a] flex gap-1.5 items-center"
                  id="chat-form"
                >
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="鍵入對話，引導拆彈特工..."
                    className="flex-1 bg-[#111111] border-2 border-[#1a1a1a] focus:border-[#00ff9f] px-3 py-2 text-xs text-white focus:outline-none transition-all font-bold tracking-wider"
                    maxLength={100}
                    id="chat-input"
                  />
                  <button 
                    type="submit"
                    className="p-2 bg-[#00ff9f]/10 text-[#00ff9f] border-2 border-[#00ff9f] hover:bg-[#00ff9f] hover:text-black transition-colors flex items-center justify-center cursor-pointer rounded-none animate-pulse"
                    id="send-chat-btn"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER METRICS INFO */}
      <footer className="border-t-2 border-[#1a1a1a] bg-black py-4 text-center text-[10px] text-[#00ff9f]/45 tracking-[0.25em] font-sans shrink-0 uppercase select-none">
        極速即時同步由 FIREBASE REALTIME DATABASE 提供支援 // 零阻斷協同演練矩陣 v1.5
      </footer>

    </div>
  );
}
