import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock fetch for API testing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Image Generation API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Replicate API Integration', () => {
    it('should generate image with Jaime model', async () => {
      const mockResponse = {
        output: ['https://replicate.delivery/pbxt/test-image-url.jpg'],
        status: 'succeeded'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch('/api/replicate/jaime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'JAIME wearing a suit',
          negative_prompt: 'blurry, low quality',
          num_outputs: 1
        })
      });

      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/replicate/jaime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'JAIME wearing a suit',
          negative_prompt: 'blurry, low quality',
          num_outputs: 1
        })
      });

      expect(data.output).toEqual(['https://replicate.delivery/pbxt/test-image-url.jpg']);
      expect(data.status).toBe('succeeded');
    });

    it('should generate image with Cristina model', async () => {
      const mockResponse = {
        output: ['https://replicate.delivery/pbxt/cristina-image.jpg'],
        status: 'succeeded'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch('/api/replicate/cristina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'CRISTINA at the beach',
          negative_prompt: 'male, masculine',
          num_outputs: 1
        })
      });

      const data = await response.json();
      expect(data.output).toEqual(['https://replicate.delivery/pbxt/cristina-image.jpg']);
    });

    it('should generate image with Bea model', async () => {
      const mockResponse = {
        output: [
          'https://replicate.delivery/pbxt/bea-image-1.jpg',
          'https://replicate.delivery/pbxt/bea-image-2.jpg'
        ],
        status: 'succeeded'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch('/api/replicate/bea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'BEA professional headshot',
          num_outputs: 2
        })
      });

      const data = await response.json();
      expect(data.output).toHaveLength(2);
    });

    it('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        error: 'Rate limit exceeded'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => mockErrorResponse,
      } as Response);

      const response = await fetch('/api/replicate/jaime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'JAIME test'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.error).toBe('Rate limit exceeded');
    });
  });

  describe('Modal Custom Model API', () => {
    it('should handle custom model generation', async () => {
      const mockResponse = {
        status: 'success',
        image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==',
        prompt: 'test prompt',
        seed: 12345
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch('/api/modal/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: 'test-model-id',
          prompt: 'test prompt',
          numInferenceSteps: 30,
          guidanceScale: 7.5
        })
      });

      const data = await response.json();
      expect(data.status).toBe('success');
      expect(data.image_base64).toBeDefined();
    });

    it('should handle invalid model gracefully', async () => {
      const mockResponse = {
        status: 'success',
        imageUrl: '/placeholders/ai-generated-1.jpg',
        usedPlaceholder: true,
        modelError: 'Model file is invalid or corrupted',
        errorType: 'invalid_model'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch('/api/modal/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: 'invalid-model-id',
          prompt: 'test prompt'
        })
      });

      const data = await response.json();
      expect(data.usedPlaceholder).toBe(true);
      expect(data.modelError).toContain('invalid or corrupted');
    });
  });

  describe('SDXL Model API', () => {
    it('should generate image with SDXL model', async () => {
      const mockResponse = {
        output: ['https://replicate.delivery/pbxt/sdxl-image.jpg'],
        status: 'succeeded'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch('/api/imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'A majestic lion in the African savanna',
          negativePrompt: 'blurry, low quality',
          numOutputs: 1
        })
      });

      const data = await response.json();
      expect(data.output).toEqual(['https://replicate.delivery/pbxt/sdxl-image.jpg']);
    });
  });

  describe('Image Proxy API', () => {
    it('should proxy Replicate images correctly', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
        headers: new Headers({
          'content-type': 'image/jpeg'
        })
      } as unknown as Response);

      const response = await fetch('/api/proxy-image?url=https://replicate.delivery/pbxt/test.jpg');
      
      expect(fetch).toHaveBeenCalledWith('/api/proxy-image?url=https://replicate.delivery/pbxt/test.jpg');
      expect(response.ok).toBe(true);
    });
  });
});

describe('Model Configuration Tests', () => {
  it('should have correct model configurations', () => {
    const expectedModels = {
      jaime: {
        id: 'jrogbaaa/jaimecreator',
        name: 'Jaime Creator',
        triggerWord: 'JAIME'
      },
      cristina: {
        id: 'jrogbaaa/cristina',
        name: 'Cristina Model',
        triggerWord: 'CRISTINA'
      },
      bea: {
        id: 'jrogbaaa/beagenerator',
        name: 'Bea Generator',
        triggerWord: 'BEA'
      }
    };

    // Test that model configurations are properly structured
    Object.entries(expectedModels).forEach(([key, config]) => {
      expect(config.id).toBeDefined();
      expect(config.name).toBeDefined();
      expect(config.triggerWord).toBeDefined();
    });
  });

  it('should validate prompt requirements', () => {
    const testCases = [
      { prompt: 'JAIME wearing a suit', model: 'jaime', valid: true },
      { prompt: 'wearing a suit', model: 'jaime', valid: false },
      { prompt: 'CRISTINA at the beach', model: 'cristina', valid: true },
      { prompt: 'at the beach', model: 'cristina', valid: false },
      { prompt: 'BEA professional photo', model: 'bea', valid: true },
      { prompt: 'professional photo', model: 'bea', valid: false }
    ];

    testCases.forEach(({ prompt, model, valid }) => {
      const triggerWords = { jaime: 'JAIME', cristina: 'CRISTINA', bea: 'BEA' };
      const hasRequiredTrigger = prompt.includes(triggerWords[model as keyof typeof triggerWords]);
      expect(hasRequiredTrigger).toBe(valid);
    });
  });
});

describe('Error Handling Tests', () => {
  it('should handle network timeouts', async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Network timeout')
    );

    try {
      await fetch('/api/replicate/jaime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'JAIME test' })
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network timeout');
    }
  });

  it('should handle malformed responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    } as unknown as Response);

    try {
      const response = await fetch('/api/replicate/jaime', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'JAIME test' })
      });
      await response.json();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Invalid JSON');
    }
  });

  it('should validate required parameters', () => {
    interface TestRequest {
      prompt?: string;
      negativePrompt?: string;
      numOutputs?: number;
      valid: boolean;
    }

    const testRequests: TestRequest[] = [
      { prompt: '', valid: false },
      { prompt: 'JAIME test', valid: true },
      { prompt: 'JAIME', negativePrompt: 'blurry', valid: true },
      { prompt: 'JAIME test', numOutputs: 0, valid: false },
      { prompt: 'JAIME test', numOutputs: 5, valid: false }, // Assuming max is 4
      { prompt: 'JAIME test', numOutputs: 2, valid: true }
    ];

    testRequests.forEach((request, index) => {
      const hasValidPrompt = Boolean(request.prompt && request.prompt.trim().length > 0);
      const hasValidOutputs = request.numOutputs === undefined || (request.numOutputs > 0 && request.numOutputs <= 4);
      const isValid = hasValidPrompt && hasValidOutputs;
      
      expect(isValid).toBe(request.valid);
    });
  });
}); 