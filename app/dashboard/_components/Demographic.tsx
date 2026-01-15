"use client"
import React, { useState } from 'react';
import { User, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {demographic} from "@/app/_utils/data/demographicData"


const DemographicPage: React.FC = () => {
  const [form, setForm] = useState<Record<string, string>>({});
  const [isFinding, setIsFinding] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleFindUser = () => {
    setIsFinding(true);
    setTimeout(() => setIsFinding(false), 1500); // Simulate find
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Demographic Data:', form);
    alert('Information saved successfully!');
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-3xl shadow-xl border-none px-12">
        <CardHeader className="p-0 gap-0 pt-8">
           <div className="flex justify-center">
             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <User size={32} />
             </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary text-center">Demographic Information</CardTitle>
          <CardDescription className="max-w-md mx-auto mt-2">
            Please fill out the following details to begin your assessment session.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 sm:px-12 py-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {demographic.map((q) => (
              <div key={q.key} className="space-y-3">
                <Label className="text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full"></span>
                  {q.question}
                </Label>

                {q.key === "phoneNumber" ? (
                  <div className="flex gap-3">
                    <Input
                      className="flex-1 h-12 shadow-sm"
                      type={q.inputType || "text"}
                      placeholder={q.placeHolder}
                      value={form[q.key] || ""}
                      onChange={(e) => handleChange(q.key, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleFindUser}
                      disabled={isFinding}
                      className="h-12 px-6 font-bold flex items-center gap-2 text-white"
                    >
                      {isFinding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Find
                    </Button>
                  </div>
                ) : q.type === "text" ? (
                  <Input
                    className="h-12 shadow-sm"
                    type={q.inputType || "text"}
                    placeholder={q.placeHolder}
                    value={form[q.key] || ""}
                    onChange={(e) => handleChange(q.key, e.target.value)}
                  />
                ) : q.type === "radio" ? (
                  <RadioGroup className="flex flex-wrap gap-4 pt-1">
                    {q.options?.map((opt) => (
                      <div
                        key={opt}
                        onClick={() => handleChange(q.key, opt)}
                        className={cn(
                          "flex items-center gap-3 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                          form[q.key] === opt
                            ? "bg-primary/5 border-primary text-primary shadow-sm"
                            : "bg-gray-50 border-transparent text-gray-500 hover:border-gray-200"
                        )}
                      >
                        <RadioGroupItem
                          isSelected={form[q.key] === opt}
                        />
                        <Label className="cursor-pointer font-bold text-[15px]">
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <select
                    className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={form[q.key] || ""}
                    onChange={(e) => handleChange(q.key, e.target.value)}
                  >
                    <option value="" disabled>Select one</option>
                    {q.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}

            <Button type="submit" className="w-full text-md py-6 mt-6 flex gap-2">
               Continue
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center gap-2 text-primary font-bold pb-10">
          <h2>Contact Us</h2>
          <span className="text-gray-300">/</span>
          <h2>Version 1.0.0</h2>
        </CardFooter>
      </Card>
    </section>
  );
};

export default DemographicPage;
