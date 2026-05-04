class ObserverMigrationGuardRouter:
    def allow_migrate(self, db, app_label, **hints):
        if db == "observer":
            return False
        return None
