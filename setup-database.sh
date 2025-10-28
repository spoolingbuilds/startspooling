#!/bin/bash

# Database Setup Script for Waitlist Application
# This script helps set up PostgreSQL database for the waitlist application

echo "🚀 Setting up PostgreSQL database for Waitlist Application..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set."
    echo "Please set it in your .env file:"
    echo "DATABASE_URL=\"postgresql://username:password@localhost:5432/startspooling_waitlist\""
    exit 1
fi

# Extract database details from DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📊 Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Create database if it doesn't exist
echo "🔧 Creating database if it doesn't exist..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database might already exist, continuing..."

# Run Prisma migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate dev --name init_postgresql_setup

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the correct DATABASE_URL"
echo "2. Run 'npm run db:studio' to open Prisma Studio"
echo "3. Test your database connection with the utility functions"
