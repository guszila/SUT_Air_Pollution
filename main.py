# streamlit app: Campus Air Quality (2 locations)
# - ใช้ได้ทั้งต่อ API จริง หรือโหมดจำลองข้อมูล
# - ตั้งค่าใน Sidebar (API URL, เกณฑ์เตือน, รีเฟรชอัตโนมัติ)

import time, math, random
from datetime import datetime, timezone, timedelta

import streamlit as st
import pandas as pd
import pydeck as pdk
import altair as alt
import requests

# --------------------------
# Sidebar (Settings)
# --------------------------
st.set_page_config(page_title="Campus Air Quality", layout="wide")
st.sidebar.title("⚙️ Settings")

api_url = st.sidebar.text_input("API base URL (มี /latest และ /series)", "http://localhost:8000")
pm25_alert = st.sidebar.number_input("PM2.5 Alert Threshold (µg/m³)", 0, 500, 50)
refresh_sec = st.sidebar.slider("Auto-refresh (sec)", 3, 60, 5)
simulate = st.sidebar.toggle("Simulate data if API not available", value=True)
st.sidebar.caption("ถ้า API ต่อไม่ได้และเปิดโหมดจำลอง ระบบจะสร้างข้อมูลสมจริงให้อัตโนมัติ")

# auto refresh
st.experimental_set_query_params(_=int(time.time() // refresh_sec))

# --------------------------
# Helpers
# --------------------------
def aqi_color_rgb(pm):
    if pm is None:         return [158,158,158]
    if pm <= 12:           return [46,204,113]   # green
    if pm <= 35:           return [241,196,15]   # yellow
    if pm <= 55:           return [230,126,34]   # orange
    if pm <= 150:          return [231,76,60]    # red
    return [142,68,173]                       # purple

def try_fetch(url, params=None, timeout=5):
    try:
        r = requests.get(url, params=params or {}, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None

# --------------------------
# Data layer (API or Sim)
# --------------------------
@st.cache_data(ttl=10)
def get_latest():
    data = try_fetch(f"{api_url}/latest")
    if data is None and simulate:
        # make 2-node fake data roughly realistic
        now = datetime.now(timezone.utc).isoformat()
        def f(base, spread):
            t = time.time()
            return round(max(0.0, base + spread*math.sin(t/60.0) + random.uniform(-spread*0.3, spread*0.3)),1)
        data = [
            {"node_id":"NODE-A","ts":now,"lat":13.736717,"lng":100.523186,
             "pm2_5":f(28,18),"pm10":f(35,22),"co2":int(f(650,250)),"temp":round(f(31,2),1),"rh":int(f(55,10))},
            {"node_id":"NODE-B","ts":now,"lat":13.738650,"lng":100.529100,
             "pm2_5":f(42,22),"pm10":f(50,25),"co2":int(f(800,300)),"temp":round(f(32,2),1),"rh":int(f(58,10))}
        ]
    return data or []

@st.cache_data(ttl=15)
def get_series(node_id, minutes=120):
    data = try_fetch(f"{api_url}/series", params={"node_id":node_id, "minutes":minutes})
    if data is None and simulate:
        # fake series 60 points
        now = datetime.now(timezone.utc)
        pts = []
        base = 30 if node_id == "NODE-A" else 42
        spread = 15 if node_id == "NODE-A" else 20
        for i in range(60):
            t = now - timedelta(minutes=(60-i)*2)
            val = max(0.0, base + spread*math.sin(i/7) + random.uniform(-3,3))
            pts.append({"ts":t.isoformat(), "pm2_5":round(val,1)})
        data = {"node_id": node_id, "points": pts}
    return (data or {"node_id":node_id,"points":[]})["points"]

# --------------------------
# UI - Header
# --------------------------
st.title("Campus Air Quality — Streamlit Web App")
rows = get_latest()
df = pd.DataFrame(rows)

# --------------------------
# Top metrics
# --------------------------
col1, col2, col3, col4 = st.columns(4)
if not df.empty:
    latest = df.iloc[0]
    col1.metric("PM2.5 (µg/m³)", latest.get("pm2_5","-"))
    col2.metric("CO₂ (ppm)", latest.get("co2","-"))
    col3.metric("Temp (°C)", latest.get("temp","-"))
    col4.metric("RH (%)", latest.get("rh","-"))
    st.caption(f"Last update: {latest.get('ts','-')}")
else:
    st.info("ยังไม่มีข้อมูลล่าสุด (ลองเปิดโหมดจำลอง หรือเช็ค API URL)")

# --------------------------
# Tabs: Map | Nodes | Trends
# --------------------------
tab_map, tab_nodes, tab_trend = st.tabs(["🗺️ Map", "📋 Nodes", "📈 Trend"])

with tab_map:
    st.subheader("Map (click markers to inspect)")
    if not df.empty:
        df_map = df.rename(columns={"lng":"lon"}).copy()
        df_map["color"] = df_map["pm2_5"].apply(aqi_color_rgb)
        layer = pdk.Layer(
            "ScatterplotLayer",
            data=df_map,
            get_position='[lon, lat]',
            get_radius=30,
            get_fill_color="color",
            pickable=True,
        )
        view_state = pdk.ViewState(
            latitude=float(df_map["lat"].mean()),
            longitude=float(df_map["lon"].mean()),
            zoom=15
        )
        deck = pdk.Deck(layers=[layer], initial_view_state=view_state,
                        tooltip={"text":"{node_id}\nPM2.5: {pm2_5} µg/m³\nCO₂: {co2} ppm"})
        st.pydeck_chart(deck)
    else:
        st.write("—")

with tab_nodes:
    st.subheader("Node status")
    if not df.empty:
        # badge style by threshold
        def badge(pm):
            if pm is None: return "—"
            if pm <= 35:  return f"✅ {pm}"
            if pm <= 55:  return f"🟧 {pm}"
            return f"🟥 {pm}"

        for _, r in df.iterrows():
            c1, c2, c3, c4, c5 = st.columns([2,2,2,2,2])
            with c1: st.write(f"**{r['node_id']}**")
            with c2: st.write(f"PM2.5: {badge(r.get('pm2_5'))} µg/m³")
            with c3: st.write(f"CO₂: {r.get('co2','-')} ppm")
            with c4: st.write(pd.to_datetime(r["ts"]).strftime("%Y-%m-%d %H:%M:%S"))
            with c5:
                st.link_button("โฟกัสบนแผนที่", "#🗺️-map")
    else:
        st.write("—")

with tab_trend:
    st.subheader("PM2.5 Trend")
    node_ids = list(df["node_id"]) if not df.empty else ["NODE-A","NODE-B"]
    node_pick = st.selectbox("เลือกจุด", node_ids, index=0)
    series = get_series(node_pick, minutes=180)
    if series:
        df_s = pd.DataFrame(series)
        df_s["ts"] = pd.to_datetime(df_s["ts"])
        chart = (
            alt.Chart(df_s)
            .mark_line()
            .encode(x="ts:T", y="pm2_5:Q")
            .properties(height=300)
        )
        thresh = alt.Chart(pd.DataFrame({"y":[pm25_alert]})).mark_rule().encode(y="y:Q")
        st.altair_chart(chart + thresh, use_container_width=True)
    else:
        st.write("— ไม่มี series —")

# --------------------------
# Alerts
# --------------------------
if not df.empty and (df["pm2_5"].fillna(0) > pm25_alert).any():
    st.error(f"⚠️ PM2.5 บางจุดเกิน {pm25_alert} µg/m³")
else:
    st.success("ค่า PM2.5 อยู่ไม่เกินเกณฑ์ที่ตั้งไว้")

st.caption("Tip: ใส่ API URL ของแบ็กเอนด์ (เช่น FastAPI เดโมที่เราเคยทำ) เพื่อดึงข้อมูลจริงแบบเรียลไทม์")

