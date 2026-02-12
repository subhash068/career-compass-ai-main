"""
Admin Logs and Monitoring Routes
Handles log viewing, error tracking, and system monitoring
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import glob
from datetime import datetime, timedelta

from models.database import get_db
from models.user import User
from routes.auth_fastapi import get_current_user

router = APIRouter(prefix="/admin/logs", tags=["Admin Logs & Monitoring"])


def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/files")
def get_log_files(
    current_user: User = Depends(require_admin),
):
    """
    Get list of available log files
    """
    try:
        log_files = []
        
        # Common log locations
        log_paths = [
            "logs/",
            "backend/logs/",
            "/var/log/career-compass/",
            "."
        ]
        
        for path in log_paths:
            if os.path.exists(path):
                # Find log files
                patterns = ['*.log', '*.txt', 'app.log', 'error.log', 'access.log']
                for pattern in patterns:
                    files = glob.glob(os.path.join(path, pattern))
                    for file in files:
                        if os.path.isfile(file):
                            stat = os.stat(file)
                            log_files.append({
                                "name": os.path.basename(file),
                                "path": file,
                                "size": stat.st_size,
                                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                                "size_human": f"{stat.st_size / 1024:.2f} KB" if stat.st_size < 1024*1024 else f"{stat.st_size / (1024*1024):.2f} MB"
                            })
        
        # Sort by modification time (newest first)
        log_files.sort(key=lambda x: x["modified"], reverse=True)
        
        return {
            "log_files": log_files[:20]  # Return top 20 most recent
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/view")
def view_log_file(
    file_path: str,
    lines: int = 100,
    search: Optional[str] = None,
    current_user: User = Depends(require_admin),
):
    """
    View contents of a log file
    """
    try:
        # Security check - prevent directory traversal
        if ".." in file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        if not os.path.isfile(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read file content
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        lines_list = content.split('\n')
        
        # Filter by search if provided
        if search:
            lines_list = [line for line in lines_list if search.lower() in line.lower()]
        
        # Get last N lines
        total_lines = len(lines_list)
        start_idx = max(0, total_lines - lines)
        recent_lines = lines_list[start_idx:]
        
        return {
            "file_name": os.path.basename(file_path),
            "file_path": file_path,
            "total_lines": total_lines,
            "showing_lines": len(recent_lines),
            "content": recent_lines,
            "search_filter": search
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/errors")
def get_recent_errors(
    hours: int = 24,
    limit: int = 100,
    current_user: User = Depends(require_admin),
):
    """
    Get recent errors from log files
    """
    try:
        errors = []
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        # Search for error patterns in recent log files
        log_paths = ["logs/", "backend/logs/", "."]
        
        for path in log_paths:
            if os.path.exists(path):
                log_files = glob.glob(os.path.join(path, "*.log"))
                
                for log_file in log_files:
                    try:
                        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                        
                        lines = content.split('\n')
                        for i, line in enumerate(lines):
                            # Look for error patterns
                            error_patterns = ['ERROR', 'CRITICAL', 'FATAL', 'Exception', 'Traceback']
                            if any(pattern in line for pattern in error_patterns):
                                # Try to extract timestamp
                                timestamp = None
                                if '[' in line and ']' in line:
                                    try:
                                        ts_str = line[line.find('[')+1:line.find(']')]
                                        timestamp = datetime.strptime(ts_str, '%Y-%m-%d %H:%M:%S')
                                    except:
                                        pass
                                
                                # Check if within time range
                                if timestamp and timestamp < cutoff_time:
                                    continue
                                
                                # Get context (lines before and after)
                                context_start = max(0, i - 2)
                                context_end = min(len(lines), i + 5)
                                context = lines[context_start:context_end]
                                
                                errors.append({
                                    "timestamp": timestamp.isoformat() if timestamp else None,
                                    "file": os.path.basename(log_file),
                                    "message": line,
                                    "context": context,
                                    "line_number": i + 1,
                                    "type": "error"
                                })
                                
                                if len(errors) >= limit:
                                    break
                        
                        if len(errors) >= limit:
                            break
                            
                    except Exception as e:
                        continue
        
        # Sort by timestamp (most recent first)
        errors.sort(key=lambda x: x["timestamp"] or "", reverse=True)
        
        return {
            "errors": errors[:limit],
            "total_found": len(errors),
            "time_range_hours": hours
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system-metrics")
def get_system_metrics(
    current_user: User = Depends(require_admin),
):
    """
    Get real-time system metrics
    """
    try:
        import psutil
        import time
        
        # CPU metrics
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_count = psutil.cpu_count()
        cpu_freq = psutil.cpu_freq()
        
        # Memory metrics
        memory = psutil.virtual_memory()
        
        # Disk metrics
        disk = psutil.disk_usage('/')
        
        # Network metrics
        network = psutil.net_io_counters()
        
        # Process info
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
            try:
                pinfo = proc.info
                if pinfo['cpu_percent'] > 0.1:  # Only show active processes
                    processes.append({
                        "pid": pinfo['pid'],
                        "name": pinfo['name'],
                        "cpu_percent": round(pinfo['cpu_percent'], 2),
                        "memory_percent": round(pinfo['memory_percent'], 2),
                        "status": pinfo['status']
                    })
            except:
                continue
        
        # Sort by CPU usage
        processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
        
        return {
            "timestamp": datetime.now().isoformat(),
            "cpu": {
                "percent": cpu_percent,
                "count": cpu_count,
                "frequency_mhz": cpu_freq.current if cpu_freq else None,
                "per_cpu": psutil.cpu_percent(percpu=True, interval=0.1)
            },
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "percent": memory.percent,
                "used_gb": round(memory.used / (1024**3), 2)
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "used_gb": round(disk.used / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2),
                "percent": disk.percent
            },
            "network": {
                "bytes_sent": network.bytes_sent,
                "bytes_recv": network.bytes_recv,
                "packets_sent": network.packets_sent,
                "packets_recv": network.packets_recv
            },
            "top_processes": processes[:10],
            "uptime_seconds": int(time.time() - psutil.boot_time())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/service-status")
def get_service_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get status of backend services
    """
    try:
        services = []
        
        # Database status
        try:
            db.execute("SELECT 1")
            services.append({
                "name": "Database",
                "status": "healthy",
                "message": "Connected"
            })
        except Exception as e:
            services.append({
                "name": "Database",
                "status": "error",
                "message": str(e)
            })
        
        # Check if AI services are available
        try:
            from ai.llm.llm_service import LLMService
            services.append({
                "name": "AI/LLM Service",
                "status": "healthy",
                "message": "Available"
            })
        except Exception as e:
            services.append({
                "name": "AI/LLM Service",
                "status": "warning",
                "message": "Not configured"
            })
        
        # Check vector store
        try:
            from ai.embeddings.vector_store import VectorStore
            services.append({
                "name": "Vector Store",
                "status": "healthy",
                "message": "Available"
            })
        except Exception as e:
            services.append({
                "name": "Vector Store",
                "status": "warning",
                "message": "Not configured"
            })
        
        return {
            "services": services,
            "overall_status": "healthy" if all(s["status"] == "healthy" for s in services) else "degraded",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api-performance")
def get_api_performance(
    hours: int = 24,
    current_user: User = Depends(require_admin),
):
    """
    Get API performance metrics
    """
    try:
        # This would typically come from a monitoring service or middleware
        # For now, return placeholder data structure
        
        return {
            "time_range_hours": hours,
            "total_requests": 0,
            "average_response_time_ms": 0,
            "error_rate_percent": 0,
            "endpoints": [],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
