"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { StoryboardFrame } from "@/src/types/video-generator";

interface StoryboardPreviewProps {
  frames: StoryboardFrame[];
  onApprove: (frameId: string) => void;
  onRegenerate: (frameId: string) => void;
  onApproveAll: () => void;
  isLoading?: boolean;
}

export default function StoryboardPreview({
  frames,
  onApprove,
  onRegenerate,
  onApproveAll,
  isLoading = false,
}: StoryboardPreviewProps) {
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(
    frames.length > 0 ? frames[0].id : null
  );

  const selectedFrame = frames.find((frame) => frame.id === selectedFrameId);
  const approvedCount = frames.filter((frame) => frame.approved).length;
  const allApproved = approvedCount === frames.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Storyboard Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={allApproved ? "default" : "outline"}>
              {approvedCount}/{frames.length} Approved
            </Badge>
            <Button
              size="sm"
              variant="default"
              onClick={onApproveAll}
              disabled={allApproved || isLoading}
            >
              Approve All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {frames.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-center p-6 text-muted-foreground">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p>Generating storyboard frames...</p>
              </div>
            ) : (
              <p>No storyboard frames have been generated yet.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Thumbnail navigation */}
            <div className="border-r border-border">
              <ScrollArea className="h-[400px]">
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {frames.map((frame) => (
                    <div
                      key={frame.id}
                      className={`relative cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                        selectedFrameId === frame.id
                          ? "border-primary ring-2 ring-primary ring-opacity-50"
                          : "border-transparent hover:border-border"
                      } ${frame.approved ? "ring-2 ring-green-500" : ""}`}
                      onClick={() => setSelectedFrameId(frame.id)}
                    >
                      <div className="relative aspect-video">
                        <Image
                          src={frame.imageUrl}
                          alt={`Scene ${frame.scene}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <Badge
                        className="absolute top-1 left-1"
                        variant="secondary"
                      >
                        {frame.scene}
                      </Badge>
                      {frame.approved && (
                        <Badge
                          className="absolute top-1 right-1"
                          variant="success"
                        >
                          ✓
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Selected frame details */}
            {selectedFrame && (
              <div className="p-6 flex flex-col h-[400px]">
                <div className="text-sm text-muted-foreground mb-2">
                  Scene {selectedFrame.scene}
                </div>
                
                <div className="relative aspect-video mb-4">
                  <Image
                    src={selectedFrame.imageUrl}
                    alt={`Scene ${selectedFrame.scene}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover rounded-md"
                  />
                </div>
                
                <Tabs defaultValue="prompt" className="flex-1">
                  <TabsList>
                    <TabsTrigger value="prompt">Prompt</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="prompt" className="h-24 overflow-y-auto mt-2">
                    <p className="text-sm">{selectedFrame.prompt}</p>
                  </TabsContent>
                  
                  <TabsContent value="details" className="h-24 overflow-y-auto mt-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedFrame.metadata && 
                        Object.entries(selectedFrame.metadata)
                          .filter(([key]) => key !== 'generatedAt')
                          .map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium capitalize">{key}:</span>{" "}
                              <span className="text-muted-foreground">
                                {typeof value === 'string' ? value : JSON.stringify(value)}
                              </span>
                            </div>
                          ))
                      }
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRegenerate(selectedFrame.id)}
                    disabled={isLoading}
                  >
                    Regenerate
                  </Button>
                  <Button
                    variant={selectedFrame.approved ? "outline" : "default"}
                    size="sm"
                    onClick={() => onApprove(selectedFrame.id)}
                    disabled={isLoading}
                  >
                    {selectedFrame.approved ? "Approved" : "Approve"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          {frames.length > 0
            ? "Approve all frames to continue to video generation."
            : "Generate a storyboard to preview your video."}
        </div>
      </CardFooter>
    </Card>
  );
} 