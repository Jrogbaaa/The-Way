"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";

export interface VideoStyle {
  id: string;
  name: string;
  description: string;
}

export interface VideoPreset {
  id: string;
  name: string;
  prompt: string;
}

interface VideoGeneratorFormProps {
  onSubmit: (data: {
    prompt: string;
    style: string;
    duration: number;
    characterReference?: string;
  }) => void;
  isProcessing: boolean;
  styles?: VideoStyle[];
  presets?: VideoPreset[];
}

export default function VideoGeneratorForm({
  onSubmit,
  isProcessing = false,
  styles = defaultStyles,
  presets = defaultPresets,
}: VideoGeneratorFormProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(styles[0]?.id || "cinematic");
  const [duration, setDuration] = useState(30);
  const [characterReference, setCharacterReference] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      prompt,
      style,
      duration,
      characterReference: characterReference || undefined,
    });
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setPrompt(preset.prompt);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>30-Second AI Video Generator</CardTitle>
        <CardDescription>
          Describe your video concept and we'll create a professionally styled
          short video.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="preset">Quick Start Templates</Label>
            <Select onValueChange={handlePresetSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Video Concept</Label>
            <Textarea
              id="prompt"
              placeholder="Describe your video concept (e.g., A man walking with a baseball bat in a neon city)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-28 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Visual Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {styles.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">
              Duration: {duration} seconds
            </Label>
            <Slider
              id="duration"
              min={10}
              max={60}
              step={5}
              value={[duration]}
              onValueChange={(value) => setDuration(value[0])}
              className="py-4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="character">Character Reference (Optional)</Label>
            <Input
              id="character"
              type="text"
              placeholder="Describe your character (e.g., woman with red hair wearing a blue jacket)"
              value={characterReference}
              onChange={(e) => setCharacterReference(e.target.value)}
            />
            {/* Would include image upload in production version */}
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!prompt.trim() || isProcessing}
          >
            {isProcessing ? "Processing..." : "Generate Video"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// Default styles that would be available in the app
const defaultStyles: VideoStyle[] = [
  { 
    id: "cinematic", 
    name: "Cinematic", 
    description: "Professional movie-like quality with cinematic color grading" 
  },
  { 
    id: "anime", 
    name: "Anime", 
    description: "Stylized anime aesthetic" 
  },
  { 
    id: "neon", 
    name: "Neon Noir", 
    description: "Dark with vibrant neon lighting" 
  },
  { 
    id: "vintage", 
    name: "Vintage", 
    description: "Retro film look with grain and faded colors" 
  }
];

// Default presets for quick start
const defaultPresets: VideoPreset[] = [
  {
    id: "urban-walk",
    name: "Urban Journey",
    prompt: "A person walking through a bustling city at night, neon lights reflecting in puddles"
  },
  {
    id: "product-showcase",
    name: "Product Showcase",
    prompt: "A sleek smartphone rotating on a minimalist platform with dynamic lighting"
  },
  {
    id: "nature-adventure",
    name: "Nature Adventure",
    prompt: "A hiker standing on a mountain peak overlooking a vast wilderness at sunrise"
  },
  {
    id: "fantasy-world",
    name: "Fantasy World",
    prompt: "A wizard casting magical spells in an enchanted forest with glowing particles"
  }
]; 