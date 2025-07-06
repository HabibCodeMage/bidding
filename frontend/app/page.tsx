"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatTimeRemaining } from "@/lib/utils"
import { Auction, PaginatedResponse, PaginationParams } from "@/api/services/Auctions"
import { AuctionCreated, AuctionUpdate } from "@/api/services/WebSocket"
import api from "@/api"

export default function Dashboard() {
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([])
  const [endedAuctions, setEndedAuctions] = useState<Auction[]>([])
  const [activeLoading, setActiveLoading] = useState(true)
  const [endedLoading, setEndedLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [wsConnected, setWsConnected] = useState(false)
  const wsConnectedRef = useRef(false)
  const handlersSetUpRef = useRef(false)
  
  // Pagination state
  const [activePage, setActivePage] = useState(1)
  const [endedPage, setEndedPage] = useState(1)
  const [activeHasMore, setActiveHasMore] = useState(true)
  const [endedHasMore, setEndedHasMore] = useState(true)
  const pageSize = 6

  // Event handlers - defined outside useEffect to prevent recreation
  const eventHandlers = useCallback(() => ({
    auctionCreated: (data: AuctionCreated) => {
      // Add new auction to the appropriate list
      const auction = data as Auction
      if (new Date(auction.endTime) > currentTime && auction.isActive) {
        setActiveAuctions(prev => {
          const auctionExists = prev.some(a => a.id === data.id)
          if (auctionExists) {
            return prev
          }
          return [auction, ...prev]
        })
      }
    },
    auctionUpdated: (data: AuctionUpdate) => {
      // Update existing auction in the appropriate list
      const updatedAuction = { ...data } as Auction
      if (new Date(updatedAuction.endTime) > currentTime && updatedAuction.isActive) {
        setActiveAuctions(prev => prev.map(auction => 
          auction.id === data.id ? { ...auction, ...data } : auction
        ))
      } else {
        // Move to ended auctions if no longer active
        setActiveAuctions(prev => prev.filter(auction => auction.id !== data.id))
        setEndedAuctions(prev => {
          const existingIndex = prev.findIndex(auction => auction.id === data.id)
          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = { ...updated[existingIndex], ...data }
            return updated
          }
          return [updatedAuction, ...prev]
        })
      }
    }
  }), [currentTime])

  // WebSocket connection and event handlers
  useEffect(() => {
    const connectWebSocket = async () => {
      // Don't connect if already connected
      if (wsConnectedRef.current) {
        return
      }

      try {
        await api.ws.connect()
        setWsConnected(true)
        wsConnectedRef.current = true
        console.log('WebSocket connected for dashboard')
        
        // Join the dashboard room
        api.ws.joinDashboard()
        
        // Only set up event listeners once
        if (!handlersSetUpRef.current) {
          const handlers = eventHandlers()
          api.ws.onAuctionCreated(handlers.auctionCreated)
          api.ws.onAuctionUpdated(handlers.auctionUpdated)
          handlersSetUpRef.current = true
        }

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
        setWsConnected(false)
        wsConnectedRef.current = false
      }
    }

    connectWebSocket()

    // Cleanup function
    return () => {
      if (wsConnectedRef.current) {
        api.ws.leaveDashboard()
        api.ws.offAuctionCreated()
        api.ws.offAuctionUpdated()
        wsConnectedRef.current = false
        handlersSetUpRef.current = false
      }
    }
  }, [eventHandlers])

  // Fetch active auctions
  useEffect(() => {
    const fetchActiveAuctions = async () => {
      try {
        setActiveLoading(true)
        const params: PaginationParams = { page: activePage, pageSize }
        const response = await api.auctions.getActiveAuctions(params)
        setActiveAuctions(prev => 
          activePage === 1 ? response.data : [...prev, ...response.data]
        )
        setActiveHasMore(response.hasMore)
        setError(null)
      } catch (err) {
        setError('Failed to fetch active auctions')
        console.error('Error fetching active auctions:', err)
      } finally {
        setActiveLoading(false)
      }
    }

    fetchActiveAuctions()
  }, [activePage, pageSize])

  // Fetch ended auctions
  useEffect(() => {
    const fetchEndedAuctions = async () => {
      try {
        setEndedLoading(true)
        const params: PaginationParams = { page: endedPage, pageSize }
        const response = await api.auctions.getEndedAuctions(params)
        setEndedAuctions(prev => 
          endedPage === 1 ? response.data : [...prev, ...response.data]
        )
        setEndedHasMore(response.hasMore)
        setError(null)
      } catch (err) {
        setError('Failed to fetch ended auctions')
        console.error('Error fetching ended auctions:', err)
      } finally {
        setEndedLoading(false)
      }
    }

    fetchEndedAuctions()
  }, [endedPage, pageSize])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate stats
  const stats = {
    activeAuctions: activeAuctions.length,
    totalBids: [...activeAuctions, ...endedAuctions].reduce((sum: number, auction: Auction) => sum + (auction.bids?.length || 0), 0),
    activeBidders: new Set([...activeAuctions, ...endedAuctions].flatMap((auction: Auction) => auction.bids?.map((bid: any) => bid.userId) || [])).size,
    totalValue: [...activeAuctions, ...endedAuctions].reduce((sum: number, auction: Auction) => sum + auction.currentHighestBid, 0),
  }

  if (activeLoading && endedLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auctions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">PayNest Auctions</h1>
            <p className="text-gray-600">Real-time bidding system</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={wsConnected ? "default" : "secondary"}
                className={wsConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
              >
                {wsConnected ? "Live" : "Offline"}
              </Badge>
            </div>
            <Link href="/create-auction">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Create Auction
              </Button>
            </Link>
          </div>
        </div>
        {/* Active Auctions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Auctions</h2>
          {activeAuctions.length === 0 && !activeLoading ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No active auctions at the moment.</p>
                <Link href="/create-auction">
                  <Button className="mt-4">Create First Auction</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeAuctions.map((auction: Auction) => (
                <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{auction.item?.name || 'Auction Item'}</CardTitle>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{auction.item?.description || 'No description available'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Starting Price:</span>
                        <span className="font-medium">{formatCurrency(auction.item?.startingPrice || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current Bid:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(auction.currentHighestBid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Time Left:</span>
                        <span className="font-medium text-orange-600">
                          {formatTimeRemaining(auction.endTime, currentTime)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bids:</span>
                        <span className="font-medium">{auction.bids?.length || 0}</span>
                      </div>
                    </div>
                    <Link href={`/auction/${auction.id}`}>
                      <Button className="w-full mt-4">View & Bid</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
              </div>
              {activeHasMore && (
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={() => setActivePage(prev => prev + 1)}
                    disabled={activeLoading}
                    variant="outline"
                  >
                    {activeLoading ? 'Loading...' : 'Load More Active Auctions'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Ended Auctions */}
        {endedAuctions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recently Ended</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {endedAuctions.map((auction: Auction) => (
                <Card key={auction.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{auction.item?.name || 'Auction Item'}</CardTitle>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        Ended
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{auction.item?.description || 'No description available'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Final Bid:</span>
                        <span className="font-bold text-green-600">{formatCurrency(auction.currentHighestBid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Winner:</span>
                        <span className="font-medium">
                          {auction.bids?.find(bid => bid.isWinningBid)?.user?.name || "No bids"}
                        </span>
                      </div>
                    </div>
                    <Link href={`/auction/${auction.id}`}>
                      <Button variant="outline" className="w-full mt-4 bg-transparent">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
            {endedHasMore && (
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={() => setEndedPage(prev => prev + 1)}
                  disabled={endedLoading}
                  variant="outline"
                >
                  {endedLoading ? 'Loading...' : 'Load More Ended Auctions'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
