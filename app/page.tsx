"use client";
import { find_translations, type Translation } from "@/app/actions";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {useState, useRef} from "react";
import {Input} from "@/components/ui/input";

const prompt = "You are an assistant that helps language learners to learn English. " +
    "You will be provided with a picture that contains English text. " +
    "You should find important words and idioms and give their meanings in English (in the meaning field), and list of their translations in Persian." +
    "Don't miss any important word or idiom. ";

async function getBase64FromImageUrl(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result as string;
            // Correctly extract the base64 part
            const base64String = base64Data.split(",")[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export default function Home() {
    const [imageUrl, setImageUrl] = useState('');
    const [translations, setTranslations] = useState<Translation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const inputFile = useRef<HTMLInputElement | null>(null);

    const handlePaste = (e: { clipboardData: { items: DataTransferItemList; }; }) => {
        const items: DataTransferItemList = e.clipboardData?.items;

        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (!file) continue;
                const url = URL.createObjectURL(file);
                setImageUrl(url);
                setTranslations([]);
                setError('');
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            setTranslations([]);
            setError('');
        }
    };

    const handleTranslate = async () => {
        if (!imageUrl) {
            setError('Please paste or select an image first');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const translations = await find_translations(
                await getBase64FromImageUrl(imageUrl),
                prompt
            );
            setTranslations(translations);
        } catch (error : unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError('Failed to get translations: ' + errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setImageUrl('');
        setTranslations([]);
        setError('');
    };

  return (
      <>
      <div className="container mx-auto p-4 max-w-2xl">
          <Card>
              <CardHeader>
                  <CardTitle>Phrase Lens</CardTitle>
                  <CardDescription>
                      Find important words and idioms in English text and give their meanings in English, and their translations in Persian.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center cursor-pointer flex flex-col gap-5"
                      onPaste={handlePaste}
                      tabIndex={0}
                      role="button"
                      aria-label="Image paste area"
                  >
                      <Input
                          type={'text'}
                          value={imageUrl}
                          onPaste={handlePaste}
                          onChange={(e) => setImageUrl(e.currentTarget.value)}
                          placeholder={'Paste an image here'}/>
                      <input
                          type="file"
                          ref={inputFile}
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                      />
                      {imageUrl ? (
                          <img src={imageUrl} alt="Pasted" className="max-h-64 mx-auto"/>
                      ) : (
                          <p className="text-gray-500" onClick={() => inputFile.current?.click()}>Paste or select an image (Ctrl+V / Cmd+V)</p>
                      )}
                  </div>

                  <Button
                      onClick={handleTranslate}
                      className="w-full mb-4"
                      disabled={isLoading || !imageUrl}
                  >
                      {isLoading ? (
                          <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                              Translating...
                          </>
                      ) : (
                          'Translate'
                      )}
                  </Button>

                  {imageUrl && (
                        <Button onClick={handleClear} variant={"outline"} className="w-full mb-4">
                            Clear
                        </Button>
                  )}

                  {error && (
                      <div className="text-red-500 mb-4">
                          {error}
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>
          {translations.length > 0 && (
              <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 px-5 md:w-10/12 mx-auto mb-5">
                  {translations.map((translation, index) => (
                      <div key={index} className="border rounded p-4 hover:bg-gray-100 transition-all">
                          <p className="font-bold text-center">{translation.text}</p>
                          <p className="text-center text-gray-500">{translation.meaning}</p>
                          <div className="flex flex-col items-center gap-2 mt-2">
                              {translation.translations.map((trans, idx) => (
                                  <p
                                      key={idx}
                                      dir={"rtl"}
                                      className="p-2 rounded w-full text-center"
                                  >
                                      {trans}
                                  </p>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </>
  );
}
