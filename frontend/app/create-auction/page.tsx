"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import api from "@/api"

export default function CreateAuction() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startingPrice: "",
    duration: "1", // minutes
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error("Item name is required")
      }
      if (!formData.description.trim()) {
        throw new Error("Description is required")
      }
      if (!formData.startingPrice || Number.parseFloat(formData.startingPrice) <= 0) {
        throw new Error("Starting price must be greater than 0")
      }

      const startingPrice = Number.parseFloat(formData.startingPrice)
      const durationMinutes = Number.parseInt(formData.duration)

      // First create the item
      const item = await api.items.createItem({
        name: formData.name.trim(),
        description: formData.description.trim(),
        startingPrice,
      })

      // Then create the auction
      const startTime = new Date()
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

      await api.auctions.createAuction({
        itemId: item.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      })

      toast({
        title: "Auction Created!",
        description: `${formData.name} has been listed for auction.`,
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create auction",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Auction</h1>
            <p className="text-gray-600">List a new item for bidding</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Auction Details
              </CardTitle>
              <CardDescription>Fill in the details for your auction item. All fields are required.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter item name (e.g., Vintage Watch, Artwork, etc.)"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of the item..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startingPrice">Starting Price ($)</Label>
                    <Input
                      id="startingPrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.startingPrice}
                      onChange={(e) => handleInputChange("startingPrice", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Auction Duration</Label>
                    <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Minute</SelectItem>
                        <SelectItem value="2">2 Minutes</SelectItem>
                        <SelectItem value="3">3 Minutes</SelectItem>
                        <SelectItem value="4">4 Minutes</SelectItem>
                        <SelectItem value="5">5 Minutes</SelectItem>
                        <SelectItem value="60">1 Hour</SelectItem>
                        <SelectItem value="120">2 Hours</SelectItem>
                        <SelectItem value="360">6 Hours</SelectItem>
                        <SelectItem value="720">12 Hours</SelectItem>
                        <SelectItem value="1440">1 Day</SelectItem>
                        <SelectItem value="4320">3 Days</SelectItem>
                        <SelectItem value="10080">1 Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Auction Preview</h3>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>
                      <strong>Name:</strong> {formData.name || "Item name will appear here"}
                    </p>
                    <p>
                      <strong>Starting Price:</strong> ${formData.startingPrice || "0.00"}
                    </p>
                    <p>
                      <strong>Duration:</strong> {(() => {
                        const duration = parseInt(formData.duration)
                        if (duration < 60) {
                          return `${duration} minute${duration !== 1 ? "s" : ""}`
                        } else if (duration === 60) {
                          return "1 hour"
                        } else if (duration < 1440) {
                          return `${duration / 60} hours`
                        } else if (duration === 1440) {
                          return "1 day"
                        } else if (duration < 10080) {
                          return `${duration / 1440} days`
                        } else {
                          return `${duration / 10080} week${duration / 10080 !== 1 ? "s" : ""}`
                        }
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Auction"}
                  </Button>
                  <Link href="/">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
