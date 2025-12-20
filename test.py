import streamlit as st
import pandas as pd

URL = "https://script.google.com/macros/s/AKfycby73kauOAQ2QASSKKMDyI4d7LOFUbcGXgSfetVtlnngeOditQvS0JrrV_4DvaDkdpKv/exec"

st.set_page_config(page_title="DHT Dashboard", layout="wide")

@st.cache_data(ttl=30)
def load_data():
    df = pd.read_csv(URL)

    st.write("📌 คอลัมน์ที่ได้จาก Web App:", df.columns.tolist())

    # --- ถ้ามี 4 คอลัมน์ตามที่ต้องการ ---
    if len(df.columns) == 4:
        df.columns = ["timestamp", "device", "temp", "humidity"]

    # --- ถ้ามี 2 คอลัมน์ -> แสดงว่า Web App ส่งข้อมูลผิด ---
    elif len(df.columns) == 2:
        st.error("❌ Sheet ส่งมาแค่ 2 คอลัมน์ ตรวจ Apps Script ด้วยว่า appendRow ถูกต้อง")
        st.stop()

    else:
        st.error(f"❌ จำนวนคอลัมน์ไม่ถูกต้อง: {len(df.columns)}")
        st.stop()

    # convert types
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce", dayfirst=True)
    df["temp"] = pd.to_numeric(df["temp"], errors="coerce")
    df["humidity"] = pd.to_numeric(df["humidity"], errors="coerce")

    df = df.dropna(subset=["timestamp", "temp", "humidity"])
    df = df.sort_values("timestamp")

    return df


# ===== โหลดข้อมูล =====
df = load_data()

st.title("🌡️ DHT Dashboard")

st.subheader("ข้อมูลล่าสุด")
st.dataframe(df.tail(10))

if df.empty:
    st.warning("ยังไม่มีข้อมูลสำหรับวาดกราฟ")
else:
    df_plot = df.set_index("timestamp")[["temp", "humidity"]]

    st.subheader("กราฟอุณหภูมิ + ความชื้น")
    st.line_chart(df_plot)

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Temperature")
        st.line_chart(df_plot["temp"])

    with col2:
        st.subheader("Humidity")
        st.line_chart(df_plot["humidity"])
