import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from typing import Callable, Dict
import os
from .context_map import generate_context_map, save_context_map

class RepositoryEventHandler(FileSystemEventHandler):
    def __init__(self, repo_path: str, repo_name: str, context_maps_dir: str):
        self.repo_path = repo_path
        self.repo_name = repo_name
        self.context_maps_dir = context_maps_dir
        # Debounce mechanism to prevent multiple rapid updates
        self.last_update = 0
        self.update_delay = 2  # seconds

    def _should_ignore(self, path: str) -> bool:
        """Check if the file should be ignored (e.g., .git directory, context_maps directory)"""
        ignore_patterns = [
            '.git',
            '__pycache__',
            '.pytest_cache',
            'node_modules',
            '.venv',
            'venv',
            '.env'
        ]
        return any(pattern in path for pattern in ignore_patterns)

    def _handle_change(self, event):
        if self._should_ignore(event.src_path):
            return
            
        current_time = time.time()
        if current_time - self.last_update < self.update_delay:
            return
            
        try:
            context_map = generate_context_map(self.repo_path, self.repo_name)
            save_context_map(context_map, self.context_maps_dir)
            self.last_update = current_time
        except Exception as e:
            print(f"Error updating context map: {str(e)}")

    def on_created(self, event):
        if not event.is_directory:
            self._handle_change(event)

    def on_modified(self, event):
        if not event.is_directory:
            self._handle_change(event)

    def on_deleted(self, event):
        if not event.is_directory:
            self._handle_change(event)

class RepositoryWatcher:
    def __init__(self, repo_path: str, repo_name: str, context_maps_dir: str):
        self.repo_path = repo_path
        self.repo_name = repo_name
        self.context_maps_dir = context_maps_dir
        self.observer = None

    def start(self):
        if self.observer is not None:
            return

        event_handler = RepositoryEventHandler(
            self.repo_path,
            self.repo_name,
            self.context_maps_dir
        )
        self.observer = Observer()
        self.observer.schedule(event_handler, self.repo_path, recursive=True)
        self.observer.start()

    def stop(self):
        if self.observer is not None:
            self.observer.stop()
            self.observer.join()
            self.observer = None

class WatcherManager:
    def __init__(self, context_maps_dir: str):
        self.context_maps_dir = context_maps_dir
        self.watchers: Dict[str, RepositoryWatcher] = {}

    def start_watching(self, repo_path: str, repo_name: str):
        if repo_name not in self.watchers:
            watcher = RepositoryWatcher(repo_path, repo_name, self.context_maps_dir)
            watcher.start()
            self.watchers[repo_name] = watcher
            return True
        return False

    def stop_watching(self, repo_name: str):
        if repo_name in self.watchers:
            self.watchers[repo_name].stop()
            del self.watchers[repo_name]
            return True
        return False

    def stop_all(self):
        for watcher in self.watchers.values():
            watcher.stop()
        self.watchers.clear()