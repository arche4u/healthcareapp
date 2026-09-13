import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent capitalize">
          about
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          This page is currently under construction. Check back soon for updates!
        </p>
      </main>
      <Footer />
    </>
  );
}
