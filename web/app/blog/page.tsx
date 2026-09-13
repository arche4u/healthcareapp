import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BlogPage() {
  const featuredPost = {
    title: "How ABDM is Reshaping Rural Healthcare in India",
    excerpt: "With the Ayushman Bharat Digital Mission rolling out nationwide, we analyze the impact of unified health records on tier-3 cities and remote clinics.",
    date: "October 12, 2025",
    author: "Dr. Aditi Sharma",
    category: "Policy & Impact",
    readTime: "8 min read"
  };

  const posts = [
    {
      title: "Introducing OneHealth's New FHIR-Native Clinical Decision Support",
      excerpt: "Our latest release brings AI-powered triage and predictive analytics directly into the doctor's workflow, natively speaking HL7 FHIR.",
      date: "September 28, 2025",
      author: "Rahul Verma",
      category: "Product Updates",
      readTime: "5 min read"
    },
    {
      title: "The Engineering Behind Sub-Second ABHA Linking",
      excerpt: "A deep dive into how our backend team optimized the Aadhaar OTP demographic authentication flow to achieve 99.9% success rates.",
      date: "September 15, 2025",
      author: "Engineering Team",
      category: "Engineering",
      readTime: "12 min read"
    },
    {
      title: "Why Zero-Trust Architecture is Mandatory for Healthcare Startups",
      excerpt: "Security in health-tech cannot be an afterthought. Learn how OneHealth implements zero-trust from the database layer to the frontend.",
      date: "August 30, 2025",
      author: "Vikram Singh",
      category: "Security",
      readTime: "10 min read"
    },
    {
      title: "A Clinician's Guide to Digital Prescriptions under NMC Guidelines",
      excerpt: "Navigating the National Medical Commission's latest guidelines on teleconsultations and e-prescriptions. What every doctor needs to know.",
      date: "August 12, 2025",
      author: "Dr. Sanjay Gupta",
      category: "Clinical Practice",
      readTime: "7 min read"
    }
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        
        {/* Header */}
        <header className="px-4 md:px-8 lg:px-16 mb-16 text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            The OneHealth Blog
          </h1>
          <p className="text-xl text-muted-foreground">
            Insights on digital health, engineering, policy, and the future of patient care in India.
          </p>
        </header>

        {/* Featured Post */}
        <section className="px-4 md:px-8 lg:px-16 mb-20 max-w-6xl mx-auto">
          <Link href="#" className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg">
            <div className="grid md:grid-cols-2">
              <div className="h-64 md:h-auto bg-muted relative flex items-center justify-center">
                {/* Placeholder for an actual image */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                <span className="text-muted-foreground font-medium relative z-10">Featured Image Placeholder</span>
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="text-primary bg-primary/10 px-3 py-1 rounded-full">{featuredPost.category}</span>
                  <span className="text-muted-foreground">{featuredPost.readTime}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed line-clamp-3">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {featuredPost.author}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {featuredPost.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Recent Posts Grid */}
        <section className="px-4 md:px-8 lg:px-16 max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold mb-8">Recent Articles</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {posts.map((post, i) => (
              <Link href="#" key={i} className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-md">
                <div className="h-48 bg-muted relative flex items-center justify-center border-b border-border">
                   <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
                   <span className="text-muted-foreground text-sm font-medium relative z-10">Image Placeholder</span>
                </div>
                <div className="p-6 flex-1 flex flex-col space-y-4">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-primary uppercase tracking-wider">{post.category}</span>
                    <span className="text-muted-foreground">{post.readTime}</span>
                  </div>
                  <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-muted-foreground line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{post.author}</span>
                      <span>·</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
