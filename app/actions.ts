"use server";
export interface Translation {
    text: string;
    meaning: string;
    translations: string[];
}

export async function find_translations(base64Image: string, prompt = " ", model = "gemini-exp-1206")
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
                            properties: {
                                text: {
                                    type: "STRING",
                                },
                                meaning: {
                                    type: "STRING",
                                },
                                translations: {
                                    type: "ARRAY",
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
