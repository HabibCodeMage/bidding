"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, User, TrendingUp, Gavel } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatTimeRemaining } from "@/lib/utils"
import api from "@/api"
import { Auction, Bid } from "@/api/services/Auctions"
import { BidUpdate, AuctionUpdate, AuctionEnd } from "@/api/services/WebSocket"
import { User as UserType } from "@/api/services/Users"

export default function AuctionDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [auction, setAuction] = useState<Auction | null>(null)
  const [bidHistory, setBidHistory] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [bidAmount, setBidAmount] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const wsConnectedRef = useRef(false)
  const handlersSetUpRef = useRef(false)

  const auctionId = parseInt(params.id as string)

  // Event handlers - defined outside useEffect to prevent recreation
  const eventHandlers = useCallback(() => ({
    bidPlaced: (data: BidUpdate) => {
      if (data.auctionId === auctionId) {
        // Update auction with new highest bid
        setAuction(prev => prev ? {
          ...prev,
          currentHighestBid: data.newHighestBid
        } : null)
        
        // Add new bid to bid history - check for duplicates
        setBidHistory(prev => {
          // Check if this bid already exists to prevent duplicates
          const bidExists = prev.some(bid => bid.id === data.bid.id)
          if (bidExists) {
            return prev
          }
          return [data.bid as Bid, ...prev]
        })
        
        // Show toast for new bid (only if it's not from current user)
        if (data.bid.userId !== parseInt(selectedUserId)) {
          const bidderName = data.bid.user?.name || users.find(u => u.id === data.bid.userId)?.name || `User ${data.bid.userId}`
          toast({
            title: "New Bid!",
            description: `${bidderName} placed a bid of ${formatCurrency(data.bid.amount)}`,
          })
        }
      }
    },
    auctionUpdated: (data: AuctionUpdate) => {
      if (data.id === auctionId) {
        setAuction(data as Auction)
      }
    },
    auctionEnded: (data: AuctionEnd) => {
      if (data.auctionId === auctionId) {
        setAuction(prev => prev ? { ...prev, isActive: false } : null)
        toast({
          title: "Auction Ended!",
          description: data.winningBid 
            ? `Winner: ${data.winningBid.user?.name || users.find(u => u.id === data.winningBid.userId)?.name || `User ${data.winningBid.userId}`} with ${formatCurrency(data.winningBid.amount)}`
            : "Auction ended with no bids",
        })
      }
    },
    bidSuccess: (data: any) => {
      toast({
        title: "Bid Placed!",
        description: `Your bid of ${formatCurrency(data.bid.amount)} has been placed successfully.`,
      })
      setBidAmount("")
    },
    bidError: (data: any) => {
      if (data.auctionId === auctionId) {
        toast({
          title: "Bid Error",
          description: data.message,
          variant: "destructive",
        })
      }
    }
  }), [auctionId, selectedUserId, toast, users])

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
        console.log('WebSocket connected for auction detail page')
        
        // Join the auction room
        api.ws.joinAuction(auctionId)
        
        // Only set up event listeners once
        if (!handlersSetUpRef.current) {
          const handlers = eventHandlers()
          api.ws.onBidPlaced(handlers.bidPlaced)
          api.ws.onAuctionUpdated(handlers.auctionUpdated)
          api.ws.onAuctionEnded(handlers.auctionEnded)
          api.ws.onBidSuccess(handlers.bidSuccess)
          api.ws.onBidError(handlers.bidError)
          handlersSetUpRef.current = true
        }

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
        setWsConnected(false)
        wsConnectedRef.current = false
      }
    }

    if (auctionId) {
      connectWebSocket()
    }

    // Cleanup function
    return () => {
      if (wsConnectedRef.current) {
        api.ws.leaveAuction(auctionId)
        api.ws.offBidPlaced()
        api.ws.offAuctionUpdated()
        api.ws.offAuctionEnded()
        api.ws.offBidSuccess()
        api.ws.offBidError()
        wsConnectedRef.current = false
        handlersSetUpRef.current = false
      }
    }
  }, [auctionId, eventHandlers])

  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        setLoading(true)
        const [auctionData, bidHistoryData] = await Promise.all([
          api.auctions.getAuction(auctionId),
          api.bids.getAuctionBids(auctionId)
        ])
        setAuction(auctionData)
        setBidHistory(bidHistoryData)
      } catch (err) {
        console.error('Error fetching auction data:', err)
        toast({
          title: "Error",
          description: "Failed to load auction data",
          variant: "destructive",
        })
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    if (auctionId) {
      fetchAuctionData()
    }
  }, [auctionId, router, toast])

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true)
        const usersData = await api.users.getAllUsers()
        setUsers(usersData)
        // Set first user as default if available
        if (usersData.length > 0) {
          setSelectedUserId(usersData[0].id.toString())
        }
      } catch (err) {
        console.error('Error fetching users:', err)
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auction...</p>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Auction not found</p>
            <Link href="/">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isActive = new Date(auction.endTime) > currentTime && auction.isActive
  const timeRemaining = formatTimeRemaining(auction.endTime, currentTime)
  const minBidAmount = auction.currentHighestBid + 1

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate input is not empty
      if (!bidAmount.trim()) {
        toast({
          title: "Invalid Bid",
          description: "Please enter a bid amount",
          variant: "destructive",
        })
        return
      }

      const amount = Number.parseFloat(bidAmount)

      // Validate it's a valid number
      if (isNaN(amount)) {
        toast({
          title: "Invalid Bid",
          description: "Please enter a valid number",
          variant: "destructive",
        })
        return
      }

      // Validate it's a whole number
      if (amount % 1 !== 0) {
        toast({
          title: "Invalid Bid",
          description: "Bid amount must be a whole number (no decimals)",
          variant: "destructive",
        })
        return
      }

      // Validate it's higher than current bid
      if (amount <= auction.currentHighestBid) {
        toast({
          title: "Invalid Bid",
          description: `Bid must be higher than current bid of ${formatCurrency(auction.currentHighestBid)}`,
          variant: "destructive",
        })
        return
      }

      if (!isActive) {
        toast({
          title: "Auction Ended",
          description: "This auction has ended and no longer accepts bids",
          variant: "destructive",
        })
        return
      }

      // Use WebSocket to place bid if connected, otherwise fallback to REST API
      if (wsConnected) {
        api.ws.placeBid({
          userId: Number.parseInt(selectedUserId),
          auctionId: auctionId,
          amount: amount,
        })
      } else {
        await api.bids.placeBid({
          userId: Number.parseInt(selectedUserId),
          auctionId: auctionId,
          amount: amount,
        })

        toast({
          title: "Bid Placed!",
          description: `Your bid of ${formatCurrency(amount)} has been placed successfully.`,
        })
        setBidAmount("")

        // Refresh auction data
        const [auctionData, bidHistoryData] = await Promise.all([
          api.auctions.getAuction(auctionId),
          api.bids.getAuctionBids(auctionId)
        ])
        setAuction(auctionData)
        setBidHistory(bidHistoryData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place bid. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{auction.item?.name || 'Auction Item'}</h1>
            <p className="text-gray-600">Auction Details & Bidding</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
            >
              {isActive ? "Active" : "Ended"}
            </Badge>
            <Badge
              variant={wsConnected ? "default" : "secondary"}
              className={wsConnected ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}
            >
              {wsConnected ? "Live" : "Offline"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Auction Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="w-5 h-5" />
                  Auction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="mt-1 text-gray-900">{auction.item?.description || 'No description available'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Starting Price</Label>
                    <p className="text-lg font-semibold">{formatCurrency(auction.item?.startingPrice || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Current Highest Bid</Label>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(auction.currentHighestBid)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Time Remaining</Label>
                    <p className={`text-lg font-semibold ${isActive ? "text-orange-600" : "text-gray-500"}`}>
                      {isActive ? timeRemaining : "Auction Ended"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Bids</Label>
                    <p className="text-lg font-semibold">{bidHistory.length}</p>
                  </div>
                </div>

                {auction.bids?.find(bid => bid.isWinningBid) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Current Leader</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {auction.bids.find(bid => bid.isWinningBid)?.user?.name || 'Unknown User'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bid History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Bid History
                </CardTitle>
                <CardDescription>Recent bidding activity for this auction</CardDescription>
              </CardHeader>
              <CardContent>
                {bidHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No bids placed yet</p>
                ) : (
                  <div className="space-y-3">
                    {bidHistory.slice(0, 10).map((bid, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {bid.user?.name || users.find(u => u.id === bid.userId)?.name || `User ${bid.userId}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{formatCurrency(bid.amount)}</p>
                          <p className="text-xs text-gray-500">{new Date(bid.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bidding Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Place Your Bid
                </CardTitle>
                <CardDescription>
                  {isActive ? `Minimum bid: ${formatCurrency(minBidAmount)}` : "This auction has ended"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isActive ? (
                  <form onSubmit={handlePlaceBid} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userId">Bidding as User</Label>
                      {usersLoading ? (
                        <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                          Loading users...
                        </div>
                      ) : (
                        <select
                          id="userId"
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bidAmount">Bid Amount ($)</Label>
                      <Input
                        id="bidAmount"
                        type="text"
                        placeholder={minBidAmount.toString()}
                        value={bidAmount}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          setBidAmount(value)
                        }}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Placing Bid..." : "Place Bid"}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">This auction has ended</p>
                    {auction.bids?.find(bid => bid.isWinningBid) ? (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="font-semibold text-green-800">
                          Winner: {auction.bids.find(bid => bid.isWinningBid)?.user?.name || 'Unknown User'}
                        </p>
                        <p className="text-green-600">Winning bid: {formatCurrency(auction.currentHighestBid)}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-600">No bids were placed</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
