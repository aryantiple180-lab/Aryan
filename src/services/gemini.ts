import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

export async function generateGeminiResponse(prompt: string): Promise<string> {
  const genAI = getGemini();
  const response = await genAI.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text || '';
}

export async function extractMedicinesFromPrescription(base64Image: string, mimeType: string): Promise<string[]> {
  const genAI = getGemini();
  const response = await genAI.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: 'Extract the names of the medicines written in this prescription. Return ONLY a JSON array of strings containing the medicine names. Do not include any other text or markdown formatting.',
        },
      ],
    },
  });

  try {
    const text = response.text || '[]';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse medicines', e);
    return [];
  }
}

export async function findNearbyHospitals(lat?: number, lng?: number, locationQuery?: string): Promise<any[]> {

  const genAI = getGemini();
  
  let contents = `Find nearby hospitals and clinics. 
Return ONLY a JSON array of objects. Do not include any markdown formatting or extra text.
Each object must have the following structure:
{
  "name": "Hospital Name",
  "address": "Full Address",
  "type": "Multispecialty / Clinic / General Hospital",
  "distance": "e.g., 2.5 km",
  "emergency": true or false,
  "doctors": ["General Physician", "Cardiologist", etc.],
  "rating": 4.5
}`;

  if (locationQuery) {
    contents = `Find nearby hospitals and clinics near ${locationQuery}. 
Return ONLY a JSON array of objects. Do not include any markdown formatting or extra text.
Each object must have the following structure:
{
  "name": "Hospital Name",
  "address": "Full Address",
  "type": "Multispecialty / Clinic / General Hospital",
  "distance": "e.g., 2.5 km",
  "emergency": true or false,
  "doctors": ["General Physician", "Cardiologist", etc.],
  "rating": 4.5
}`;
  }
  
  const config: any = {
    tools: [{ googleMaps: {} }]
  };
  
  if (lat !== undefined && lng !== undefined) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: lat,
          longitude: lng
        }
      }
    };
  }

  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config
  });

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  let places: any[] = [];
  
  try {
    const text = response.text || '[]';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    places = JSON.parse(cleaned);
    
    // Merge with grounding chunks to get URIs
    if (chunks) {
      places = places.map(place => {
        const matchingChunk = chunks.find((c: any) => c.maps?.title?.toLowerCase().includes(place.name.toLowerCase().split(' ')[0]));
        return {
          ...place,
          uri: matchingChunk?.maps?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`
        };
      });
    } else {
      places = places.map(place => ({
        ...place,
        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`
      }));
    }
  } catch (e) {
    console.error('Failed to parse hospitals JSON', e);
    // Fallback to chunks if JSON parsing fails
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps?.uri) {
          places.push({
            name: chunk.maps.title || 'Hospital/Pharmacy',
            uri: chunk.maps.uri,
            address: chunk.maps.placeAnswerSources?.reviewSnippets?.[0] || 'Address not available',
            type: 'General Hospital',
            distance: 'Unknown',
            emergency: true,
            doctors: ['General Physician'],
            rating: 4.0
          });
        }
      });
    }
  }

  return places;
}
