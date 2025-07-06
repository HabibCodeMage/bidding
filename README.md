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
- **Docker and Docker Compose** (version 2.0+)
- **Node.js 20+** (for local development)
- **Yarn package manager** (version 1.22+)
- **Git** for cloning the repository

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: At least 2GB free space
- **Ports**: 3000, 3001, 5432, 6379 must be available

### Running with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/HabibCodeMage/bidding.git
   cd real-time-bid
   ```

2. **Environment Setup**
   ```bash
   # Copy environment files (if not already present)
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

3. **Start all services**
   ```bash
   sudo docker compose up --build
   ```

4. **Wait for services to be ready**
   - PostgreSQL: ~30 seconds
   - Redis: ~10 seconds
   - Backend: ~60 seconds (includes dependency installation)
   - Frontend: ~45 seconds

5. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:3001
   - **PostgreSQL**: localhost:5432
   - **Redis**: localhost:6379

6. **Verify installation**
   ```bash
   # Check if all services are running
   docker compose ps
   
   # Check backend 
   curl http://localhost:3001
   
   # Check database connection
   docker compose exec postgres pg_isready -U postgres
   ```

### Local Development Setup

#### Backend Development

1. **Install dependencies**
   ```bash
   cd backend
   yarn install
   ```

2. **Environment configuration**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Update database connection (if using local PostgreSQL)
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=realtime_bid
   ```

3. **Database setup**
   ```bash
   # Start PostgreSQL and Redis
   docker compose up postgres redis -d
   
   # Wait for database to be ready
   docker compose exec postgres pg_isready -U postgres
   ```

4. **Run development server**
   ```bash
   yarn start:dev
   ```

#### Frontend Development

1. **Install dependencies**
   ```bash
   cd frontend
   yarn install
   ```

2. **Environment configuration**
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   
   # Update API endpoints
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=http://localhost:3001
   ```

3. **Run development server**
   ```bash
   yarn dev
   ```

4. **Run tests**
   ```bash
   yarn test              # Run tests once
   yarn test:watch        # Run tests in watch mode
   yarn test:coverage     # Run tests with coverage
   ```

### Troubleshooting Local Setup

#### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :3000
   lsof -i :3001
   lsof -i :5432
   lsof -i :6379
   
   # Kill processes if needed
   kill -9 <PID>
   ```

2. **Docker issues**
   ```bash
   # Reset Docker environment
   docker compose down -v
   docker system prune -f
   docker compose up --build
   ```

3. **Database connection issues**
   ```bash
   # Check database health
   docker compose exec postgres pg_isready -U postgres
   
   # Reset database
   docker compose down -v
   docker compose up postgres redis -d
   ```

4. **Node modules issues**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules yarn.lock
   yarn install
   ```
  
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
- **postgres**: PostgreSQL database
- **redis**: Redis cache with memory limits
- **backend**: NestJS application with hot reload
- **frontend**: Next.js application with hot reload

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is configured in `.github/workflows/ci-cd.yml` and includes:

#### 1. **Testing Phase**
   - **Backend Unit Tests**: Jest-based testing with coverage reporting
   - **Frontend Tests**: React Testing Library with component testing
   - **Code Quality Checks**: ESLint and TypeScript compilation
   - **Build Verification**: Ensures both frontend and backend build successfully

#### 2. **Build Phase**
   - **Docker Image Building**: Multi-stage builds for optimization
   - **Security Scanning**: Vulnerability scanning of dependencies
   - **Image Optimization**: Layer caching and size optimization
   - **Artifact Storage**: Caching build artifacts for faster deployments

#### 3. **Deployment Phase**
   - **Staging Deployment**: Automatic deployment on main branch pushes
   - **Production Deployment**: Manual deployment with environment selection
   - **Environment Configuration**: Separate configs for staging/production

### Pipeline Configuration

#### Workflow Triggers
```yaml
on:
  workflow_dispatch:
    inputs:
      target_environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production
      skip_testing:
        description: 'Skip running tests'
        required: false
        default: false
        type: boolean
      skip_build:
        description: 'Skip building Docker images'
        required: false
        default: false
        type: boolean
```

#### Job Dependencies
- **test-backend** → **build-and-deploy**
- **test-frontend** → **build-and-deploy**
- **build-and-deploy** → **deploy-backend**
- **build-and-deploy** → **deploy-frontend**

### Running the Pipeline

#### 1. **Manual Deployment**
1. Go to GitHub repository → Actions tab
2. Select "CI/CD Pipeline" workflow
3. Click "Run workflow"
4. Choose target environment (staging/production)
5. Configure optional parameters:
   - Skip testing: `false` (recommended)
   - Skip build: `false` (recommended)
6. Click "Run workflow"

### Deployment Platforms
#### Frontend (Vercel)
#### Backend (Render)
#### Database free instance (Render)
#### Redis free instance (Render)


### Environment Configuration

#### Staging Environment
```env
NODE_ENV=staging
DB_HOST=staging-db.render.com
REDIS_URL=redis://staging-redis.render.com
CACHE_TTL=30000
```

#### Production Environment
```env
NODE_ENV=production
DB_HOST=production-db.render.com
REDIS_URL=redis://production-redis.render.com
CACHE_TTL=60000
```

### Deployment Verification

#### 1. **Health Checks**
```bash
# Backend check
curl https://bidding-kgn3.onrender.com/

# Frontend accessibility
curl -I https://bidding-flax.vercel.app/

# Database connectivity
docker compose exec postgres pg_isready -U postgres
```

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

## 🎯 Development Approach & Problem-Solving Strategy

### Problem Analysis & Solution Design

#### Initial Requirements Analysis
1. **Real-time Bidding System**: Required WebSocket communication for live updates
2. **Concurrent Auctions**: Multiple auctions running simultaneously
3. **Scalability**: System must handle high load and multiple users
4. **Race Conditions**: Prevent bid conflicts and ensure data consistency
5. **User Experience**: Responsive, intuitive interface with real-time feedback

#### Key Architectural Decisions

1. **Technology Stack Selection**
   - **Backend**: NestJS for robust, scalable API development
   - **Frontend**: Next.js 15 with React 19 for modern, performant UI
   - **Database**: PostgreSQL for ACID compliance and complex queries
   - **Caching**: Redis for session management and real-time data
   - **Real-time**: Socket.IO for bidirectional communication

2. **Database Design Strategy**
   - **Normalized Schema**: Ensures data integrity and reduces redundancy
   - **Indexed Fields**: Optimizes query performance for frequent operations
   - **Foreign Key Constraints**: Maintains referential integrity
   - **Timestamp Fields**: Tracks creation and update times for audit trails

3. **Real-time Communication Architecture**
   - **WebSocket Gateway**: Centralized real-time event handling
   - **Room-based Messaging**: Targeted updates for specific auctions
   - **Redis Pub/Sub**: Cross-instance communication for horizontal scaling
   - **Instance Isolation**: Prevents message loops in multi-instance deployments

### Robustness & Scalability Implementation

#### 1. **Horizontal Scaling Strategy**
```typescript
// Instance-aware message routing
if (message.instanceId !== (process.env.INSTANCE_ID || 'unknown')) {
  this.server.to(`auction-${message.auctionId}`).emit('bidPlaced', data);
}
```

#### 2. **Connection Resilience**
```typescript
// Automatic retry mechanism with exponential backoff
let retries = 0;
const maxRetries = 10;
while (retries < maxRetries) {
  try {
    await this.redisService.subscribe(channel, handler);
    break;
  } catch (error) {
    retries++;
    await new Promise(resolve => setTimeout(resolve, 1000 * retries));
  }
}
```

#### 3. **Database Connection Management**
- **Connection Pooling**: Efficient resource utilization
- **Transaction Management**: Ensures data consistency
- **Query Optimization**: Indexed fields and optimized queries

#### 4. **Caching Strategy**
- **Session Management**: Redis-based user sessions
- **Auction Data Caching**: Frequently accessed auction information
- **TTL-based Invalidation**: Automatic cache cleanup
- **Memory Management**: Redis memory limits and LRU policies

### Race Condition Prevention

#### 1. **Bid Validation Strategy**
```typescript
// Database-level constraints
@Column('decimal', { precision: 10, scale: 2 })
currentHighestBid: number;

// Optimistic locking
@VersionColumn()
version: number;

// Atomic operations
@Transaction()
async placeBid(bidData: PlaceBidDto): Promise<Bid> {
  // Validate auction is active
  // Check bid amount > current highest
  // Atomic update with version check
}
```

#### 2. **Auction Management**
- **Server-side Time Validation**: Prevents client-side time manipulation
- **Database Triggers**: Automatic auction status updates
- **Scheduled Tasks**: Auction expiration handling
- **State Machine**: Clear auction lifecycle management

#### 3. **Concurrent Access Handling**
- **Database Transactions**: ACID compliance for critical operations
- **Row-level Locking**: Prevents concurrent bid conflicts
- **Deadlock Prevention**: Proper transaction ordering
- **Connection Pooling**: Efficient resource management

### Performance Optimization Strategies

#### 1. **Frontend Optimizations**
- **Code Splitting**: Lazy loading of components and routes
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: Next.js automatic image optimization

#### 2. **Backend Optimizations**
- **Query Optimization**: Efficient database queries with proper indexing
- **Response Caching**: Redis-based API response caching
- **WebSocket Efficiency**: Minimal payload sizes and efficient event handling
- **Memory Management**: Proper garbage collection and memory monitoring

#### 3. **Database Optimizations**
- **Index Strategy**: Composite indexes for complex queries
- **Query Planning**: Optimized execution plans
- **Connection Management**: Efficient connection pooling
- **Data Archiving**: Historical data management

### Testing Strategy

#### 1. **Backend Testing**
- **Unit Tests**: Individual service and controller testing

#### 2. **Frontend Testing**
- **Component Tests**: UI component behavior testing

#### 3. **Load Testing**
- **Concurrent Users**: Simulate multiple simultaneous users
- **Bid Frequency**: Test high-frequency bidding scenarios
- **Database Load**: Stress test database performance
- **WebSocket Connections**: Test connection limits and stability

#### 4. **Manual Testing**
- **User Workflows**: Manual testing of complete user journeys
- **Cross-browser Testing**: Testing across different browsers
- **Mobile Responsiveness**: Testing on various screen sizes
- **Real-time Scenarios**: Manual testing of live bidding scenarios

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