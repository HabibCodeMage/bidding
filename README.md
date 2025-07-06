# Real-Time Bidding System

A robust, scalable real-time bidding system built with NestJS backend and Next.js frontend, featuring live auction management, real-time bid updates, and concurrent auction handling.

## 🚀 Live Demo

- **Frontend**: [Deployed on Vercel](https://bidding-flax.vercel.app/)
- **Backend**: [Deployed on Render](https://bidding-kgn3.onrender.com)

## 🏗️ Architecture Overview

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis for real-time data and session management
- **Real-time Communication**: Socket.IO for live bid updates
- **Cross-Instance Communication**: Redis Pub/Sub for multi-instance scaling
- **API**: RESTful APIs with validation

### Frontend (Next.js)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: React hooks with Socket.IO client

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Database**: PostgreSQL with Redis caching layer

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: NestJS 11
- **Database**: PostgreSQL 15
- **ORM**: TypeORM
- **Caching**: Redis 7
- **Real-time**: Socket.IO
- **Validation**: class-validator, class-transformer
- **Testing**: Jest

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client

## 📋 Features

### Core Functionality
- ✅ Create and manage auction items
- ✅ Real-time bidding with live updates
- ✅ Auction duration management
- ✅ Concurrent auction handling
- ✅ User authentication (hardcoded 100 users)
- ✅ Bid validation and error handling

### Real-time Features
- ✅ Live bid updates via WebSocket
- ✅ Auction countdown timers
- ✅ Real-time highest bid display
- ✅ Instant bid confirmation/rejection
- ✅ Cross-instance real-time synchronization
- ✅ Redis Pub/Sub for horizontal scaling

### User Experience
- ✅ Responsive design for mobile and desktop
- ✅ Intuitive auction dashboard
- ✅ Detailed auction views
- ✅ Real-time error notifications
- ✅ Loading states and feedback

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Yarn package manager

### Running with Docker 

1. **Clone the repository**
   ```bash
   git clone https://github.com/HabibCodeMage/bidding.git
   cd real-time-bid
   ```

2. **Start all services**
   ```bash
   sudo docker compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379
  
## 📊 API Endpoints

### Items
- `GET /items` - Get all auction items
- `POST /items` - Create new auction item
- `GET /items/:id` - Get specific item details

### Auctions
- `GET /auctions` - Get all active auctions
- `GET /auctions/:id` - Get specific auction details
- `POST /auctions` - Create new auction

### Bids
- `POST /bids` - Place a new bid
- `GET /bids/item/:itemId` - Get bids for specific item

### Users
- `GET /users` - Get all users (hardcoded 100 users)

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=realtime_bid
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_TTL=30000
REDIS_URL=redis://redis:6379
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
yarn test              # Run unit tests
yarn test:e2e          # Run end-to-end tests
yarn test:cov          # Run tests with coverage
```

### Frontend Tests
```bash
cd frontend
yarn test              # Run unit tests
```

## 🐳 Docker Configuration

### Backend Dockerfile
- Multi-stage build for optimization
- Node.js 20 Alpine base image
- Production-ready configuration

### Frontend Dockerfile
- Next.js optimized build
- Static file serving
- Production environment setup

### Docker Compose Services
- **postgres**: PostgreSQL database with health checks
- **redis**: Redis cache with memory limits
- **backend**: NestJS application with hot reload
- **frontend**: Next.js application with hot reload

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Testing Phase**
   - Backend unit tests
   - Frontend build verification
   - Code quality checks

2. **Build Phase**
   - Docker image building
   - Multi-stage optimization
   - Security scanning

3. **Deployment Phase**
   - Automatic deployment to staging
   - Manual deployment to production
   - Environment-specific configurations

### Pipeline Triggers
- **Manual**: Workflow dispatch with environment selection
- **Automatic**: On push to main branch (staging)
- **Pull Requests**: Automated testing

### Deployment Platforms
- **Frontend**: Vercel (automatic deployments)
- **Backend**: Render (containerized deployment)
- **Database**: Managed PostgreSQL service

## 🏛️ System Design Decisions

### Scalability Considerations

1. **Database Design**
   - Normalized schema for data integrity
   - Indexed fields for query optimization
   - Connection pooling for concurrent access

2. **Caching Strategy**
   - Redis for session management
   - Cache frequently accessed auction data
   - TTL-based cache invalidation

3. **Real-time Communication**
   - Socket.IO for bidirectional communication
   - Room-based messaging for auction-specific updates
   - Connection management and reconnection handling
   - **Redis Pub/Sub for cross-instance communication**
   - **Instance-aware message routing to prevent duplicate emissions**
   - **Automatic retry mechanism for Redis connection initialization**

#### WebSocket Architecture Details
- **AuctionGateway**: Handles real-time bid updates and auction events
- **Redis Channels**: 
  - `auction:bid:placed` - Broadcasts new bids across instances
  - `auction:updated` - Broadcasts auction updates
  - `auction:ended` - Broadcasts auction completion
  - `auction:created` - Broadcasts new auction creation
- **Instance Isolation**: Each instance has unique `INSTANCE_ID` to prevent message loops
- **Room Management**: Clients join specific auction rooms for targeted updates
- **Dashboard Updates**: Real-time dashboard with live auction status
- **Connection Resilience**: Automatic retry mechanism with exponential backoff

### Race Condition Prevention

1. **Bid Validation**
   - Database-level constraints
   - Optimistic locking for bid amounts
   - Atomic operations for bid placement

2. **Auction Management**
   - Server-side time validation
   - Database triggers for auction status
   - Scheduled tasks for auction expiration

3. **Concurrent Access**
   - Connection pooling
   - Transaction management
   - Deadlock prevention strategies

### Performance Optimizations

1. **Frontend**
   - Code splitting and lazy loading
   - Optimized bundle size

2. **Backend**
   - Query optimization
   - Response caching
   - Efficient WebSocket handling

3. **Database**
   - Proper indexing strategy
   - Query optimization
   - Connection management

## 🔒 Security Considerations

1. **Input Validation**
   - Server-side validation with class-validator
   - SQL injection prevention with TypeORM
   - XSS protection with proper escaping

2. **Data Protection**
   - Environment variable management
   - Secure database connections
   - HTTPS enforcement in production

## 🚨 Troubleshooting

### Common Issues

1. **Docker Compose Issues**
   ```bash
   # Reset Docker environment
   docker compose down -v
   docker system prune -f
   docker compose up --build
   ```

2. **Database Connection Issues**
   ```bash
   # Check database health
   docker compose exec postgres pg_isready -U postgres
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis health
   docker compose exec redis redis-cli ping
   ```

### Development Tips

1. **Hot Reload Issues**
   - Ensure volume mounts are correct
   - Check file permissions
   - Restart development containers

2. **Port Conflicts**
   - Check if ports 3000, 3001, 5432, 6379 are available
   - Modify docker-compose.yml if needed

3. **Memory Issues**
   - Increase Docker memory limits
   - Optimize Redis memory settings
   - Monitor container resource usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NestJS team for the excellent framework
- Next.js team for the React framework
- Docker team for containerization tools
- GitHub Actions for CI/CD automation

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the troubleshooting section above

---

**Note**: This is a demonstration project for the PayNest interview. The system is designed to handle real-world scenarios with proper error handling, scalability considerations, and production-ready deployment configurations. 