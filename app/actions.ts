"use server";
export interface Translation {
    text: string;
    meaning: string;
    translations: string[];
}

export async function find_translations(base64Image: string, prompt = " ", model = "gemini-2.0-flash-exp")
: Promise<Translation[]> {
    const GOOGLE_API_KEY = process.env.GEMINI_API_KEY;

    const payload = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/png",
                            data: base64Image,
                        },
                    },
                ],
            },
        ],
        generationConfig: {
            response_mime_type: "application/json",
            response_schema: {
                type: "OBJECT",
                properties: {
                    response: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            required: ["text", "meaning", "translations"],
                            properties: {
                                text: {
                                    type: "STRING",
                                    description: "The word or idiom in English.",
                                },
                                meaning: {
                                    type: "STRING",
                                    description: "The meaning of the word or idiom in English.",
                                },
                                translations: {
                                    type: "ARRAY",
                                    description: "The list of translations in Persian. Multiple translations are possible, if needed.",
                                    items: {
                                        type: "STRING",
                                    },
                                },
                            }
                        }
                    }
                }
            }
        },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;
    const headers = {
        "Content-Type": "application/json",
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log("Tokens Used: ", responseData['usageMetadata']['totalTokenCount']);
            const image_json = responseData['candidates'][0]['content']['parts'][0]['text'];
            return JSON.parse(image_json)['response'];
        } else {
            const errorText = await response.text();
            console.error("Error:", errorText);
            return [];
        }
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}
