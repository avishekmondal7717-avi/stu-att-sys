import streamlit as st
import pandas as pd
import time 
from datetime import datetime
import os
from streamlit_autorefresh import st_autorefresh

# Auto refresh page every 2 seconds to show live attendance
count = st_autorefresh(interval=2000, limit=None, key="attendance_refresh")

st.title("Smart Attendance Dashboard")

ts = time.time()
date = datetime.fromtimestamp(ts).strftime("%d-%m-%y")
csv_file = os.path.join(os.path.dirname(__file__), "Attendance", f"Attendance_{date}.csv")

if os.path.exists(csv_file):
    df = pd.read_csv(csv_file)
    st.dataframe(df.style.highlight_max(axis=0), use_container_width=True)
else:
    st.warning(f"No attendance data found for today ({date}).")