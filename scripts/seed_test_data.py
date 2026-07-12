"""Populate a Pomodoro Tracker database with deterministic development data."""

from __future__ import annotations

import random
import sqlite3
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


SEED = 20260712
TEST_PREFIX = "[测试] "


def utc_iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def main(database_path: str) -> None:
    path = Path(database_path)
    if not path.exists():
        raise SystemExit(f"Database does not exist: {path}")

    random.seed(SEED)
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA foreign_keys = ON")

    backup_path = path.with_name(f"{path.stem}.before-test-seed{path.suffix}")
    if not backup_path.exists():
        backup = sqlite3.connect(backup_path)
        connection.backup(backup)
        backup.close()

    now = datetime.now().astimezone()
    task_specs = [
        ("[测试] 产品开发", None, "产品与工程开发测试数据", None, None),
        ("需求规划", "[测试] 产品开发", "整理需求、拆分迭代目标", 25, 5),
        ("数据看板", "[测试] 产品开发", "开发可视化与时间范围筛选", 40, 8),
        ("图表交互", "数据看板", "嵌套圆环、图例和交互细节", 35, 7),
        ("查询优化", "数据看板", "优化 SQLite 聚合查询", None, None),
        ("桌面端体验", "[测试] 产品开发", "改进 Electron 桌面端体验", 30, 5),
        ("计时小窗", "桌面端体验", "无边框窗口、位置恢复与状态同步", None, None),
        ("发布准备", "[测试] 产品开发", "检查安装包与发布说明", None, None),
        ("[测试] 学习计划", None, "课程与自主学习测试数据", None, None),
        ("算法与数据结构", "[测试] 学习计划", "算法课程与练习", 45, 10),
        ("动态规划", "算法与数据结构", "状态设计与经典题型", None, None),
        ("图搜索", "算法与数据结构", "BFS、DFS 与启发式搜索", None, None),
        ("英语阅读", "[测试] 学习计划", "技术文章和论文阅读", 25, 5),
        ("[测试] 生活管理", None, "生活习惯测试数据", None, None),
        ("运动", "[测试] 生活管理", "有氧和力量训练", 30, 10),
        ("阅读", "[测试] 生活管理", "非虚构与技术书籍", 25, 5),
    ]

    with connection:
        connection.execute(
            "DELETE FROM tasks WHERE parent_id IS NULL AND title LIKE ?",
            (f"{TEST_PREFIX}%",),
        )
        ids: dict[str, int] = {}
        for index, (title, parent_title, notes, focus_minutes, break_minutes) in enumerate(task_specs):
            parent_id = ids.get(parent_title) if parent_title else None
            created_at = utc_iso(now - timedelta(days=365 - index * 9))
            status = "done" if title == "发布准备" else "active"
            completed_at = utc_iso(now - timedelta(days=18)) if status == "done" else None
            cursor = connection.execute(
                """
                INSERT INTO tasks
                  (parent_id, title, notes, status, focus_minutes, break_minutes,
                   created_at, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    parent_id,
                    title,
                    notes,
                    status,
                    focus_minutes,
                    break_minutes,
                    created_at,
                    completed_at,
                ),
            )
            ids[title] = int(cursor.lastrowid)

        session_tasks = [
            "需求规划",
            "图表交互",
            "查询优化",
            "计时小窗",
            "发布准备",
            "动态规划",
            "图搜索",
            "英语阅读",
            "运动",
            "阅读",
        ]
        note_templates = {
            "需求规划": ["整理下一迭代需求并确定优先级", "拆分功能并补充验收条件"],
            "图表交互": ["完善嵌套圆环和层级图例", "调整图表颜色与悬浮提示"],
            "查询优化": ["重构日期范围聚合查询", "检查递归层级统计结果"],
            "计时小窗": ["优化小窗拖动与位置恢复", "检查计时状态同步逻辑"],
            "发布准备": ["整理发布清单和版本说明", "检查 Windows 安装流程"],
            "动态规划": ["完成两道动态规划练习", "整理状态转移方程笔记"],
            "图搜索": ["复习 BFS 与 A* 搜索", "完成图搜索课程练习"],
            "英语阅读": ["阅读一篇技术文章并摘录生词", "精读论文摘要和结论"],
            "运动": ["完成有氧训练和拉伸", "完成核心力量训练"],
            "阅读": ["阅读一章并整理要点", "摘录书中三个关键观点"],
        }

        sessions: list[tuple[str, datetime, bool]] = []
        # Dense data for today so the day dashboard immediately has multiple slices.
        for index, title in enumerate(session_tasks[:8]):
            sessions.append((title, now - timedelta(minutes=12 + index * 38), index not in {2, 6}))
        # At least two records on every day of the current week.
        for days_ago in range(1, 7):
            for offset in range(2):
                title = session_tasks[(days_ago * 2 + offset) % len(session_tasks)]
                completed = now - timedelta(days=days_ago, hours=2 + offset * 3)
                sessions.append((title, completed, (days_ago + offset) % 4 != 0))
        # Guaranteed coverage across all months of the previous year.
        for month_offset in range(12):
            for sample in range(5):
                completed = now - timedelta(days=month_offset * 30 + sample * 3 + 8)
                title = session_tasks[(month_offset + sample) % len(session_tasks)]
                sessions.append((title, completed, (month_offset + sample) % 6 != 0))
        # Additional deterministic random records for richer annual charts.
        for _ in range(72):
            title = random.choice(session_tasks)
            completed = now - timedelta(
                days=random.randint(7, 360),
                hours=random.randint(0, 20),
                minutes=random.randint(0, 59),
            )
            sessions.append((title, completed, random.random() > 0.18))

        inserted_full = 0
        inserted_interrupted = 0
        for title, completed, is_complete in sessions:
            duration_seconds = (
                random.choice([15, 25, 30, 40, 45]) * 60
                if is_complete
                else random.randint(2, 14) * 60 + random.randint(0, 59)
            )
            started = completed - timedelta(seconds=duration_seconds)
            base_note = random.choice(note_templates[title])
            note = base_note if is_complete else f"{base_note}，因临时事项提前结束"
            connection.execute(
                """
                INSERT INTO pomodoro_sessions
                  (task_id, duration_seconds, started_at, completed_at,
                   counts_as_pomodoro, note)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    ids[title],
                    duration_seconds,
                    utc_iso(started),
                    utc_iso(completed),
                    1 if is_complete else 0,
                    note,
                ),
            )
            inserted_full += int(is_complete)
            inserted_interrupted += int(not is_complete)

    task_count = connection.execute(
        "SELECT COUNT(*) FROM tasks WHERE title LIKE ?", (f"{TEST_PREFIX}%",)
    ).fetchone()[0]
    connection.close()
    print(f"Created {len(task_specs)} test tasks ({task_count} top-level test roots matched by prefix query).")
    print(f"Created {len(sessions)} sessions: {inserted_full} complete, {inserted_interrupted} interrupted.")
    print(f"Backup: {backup_path}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: seed_test_data.py <database-path>")
    main(sys.argv[1])
