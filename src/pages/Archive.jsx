// src/pages/Archive.jsx
import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const PAGE_SIZE = 20;

export default function Archive() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("archived"); // "archived" | "trash"
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    resetAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  const resetAndFetch = async () => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setErr("");
    await fetchPage(true);
  };

  const fetchPage = async (isFirst = false) => {
    if (!user || (!isFirst && !hasMore)) return;
    setLoading(true);