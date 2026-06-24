#!/bin/bash
# 백엔드 실행 스크립트 — venv 파이썬으로 server.py 실행
# 사용: ./run.sh   (실행권한 없으면  bash run.sh)
cd "$(dirname "$0")"
exec ./venv/bin/python server.py
