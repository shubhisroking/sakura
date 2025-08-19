"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DetailsSection() {
  return (
    <section className="relative w-full min-h-screen bg-[#141414] text-[#e3e3db] py-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-serif mb-6">
            What is Sakura?
          </h2>
          <p className="text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed opacity-90">
            Sakura is an upcoming HackClub event where teens ship amazing projects 
            and they get a week in Japan, flights and stay sponsored.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-[#e3e3db] text-[#141414] border-none">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">SHIP SHIP SHIP!!!</CardTitle>
              <CardDescription className="text-[#141414] opacity-80">
                Build and ship your projects and get tokens to get your trip to Japan!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[#141414] opacity-90">
                Whether it&apos;s a web app, mobile app, game, or hardware project
                if you can build it, you can ship it for Sakura.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#e3e3db] text-[#141414] border-none">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">🌸 Get Japan Trip</CardTitle>
              <CardDescription className="text-[#141414] opacity-80">
                If you collect enough tokens, you can get an all-expenses-paid trip to Japan!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[#141414] opacity-90">
                Meet other HackClubbers in the beautiful city of Tokyo!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#e3e3db] text-[#141414] border-none">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Join HackClub slack</CardTitle>
              <CardDescription className="text-[#141414] opacity-80">
                Join the HackClub Slack community to connect with other HackClubbers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[#141414] opacity-90">
                You will get updates about the event, important deadlines, and more!
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-serif mb-12">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Sign Up", desc: "Register for Sakura and join the slack" },
              { step: "02", title: "Build", desc: "Create projects using literally any techstack" },
              { step: "03", title: "Ship", desc: "Deploy your projects with a playable url" },
              { step: "04", title: "Collect tokens and go Japan", desc: "Collect tokens to get the trip to Japan!" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-6xl font-serif text-pink-300 mb-4">{item.step}</div>
                <h4 className="text-2xl font-serif mb-3">{item.title}</h4>
                <p className="opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-[#e3e3db] text-[#141414] hover:bg-[#d3d3ca] text-xl px-12 py-6 rounded-full font-serif"
          >
            Login with Slack
          </Button>
        </div>
      </div>
    </section>
  );
}
