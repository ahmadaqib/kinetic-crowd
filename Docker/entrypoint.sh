#!/bin/sh
set -e

# Run migrations if database is ready
php artisan migrate --force --no-interaction

# Cache configuration and routes for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions for storage/logs just in case
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

exec "$@"
