// import {Bookmark} from "@prisma/client";
//
// export const dummyBookmarks: Bookmark[] = [
//     {
//         id: "100",
//         title: "Full Stack Development Roadmap 2024",
//         description: "Complete guide to becoming a full stack developer",
//         url: "https://roadmap.sh/full-stack",
//         tags: ["programming", "web-development", "career"],
//         isRead: false,
//         isFavorite: true,
//         dateAdded: "2024-01-02"
//     },
//     {
//         id: "1",
//         title: "Full Stack Development Roadmap 2024",
//         description: "Complete guide to becoming a full stack developer",
//         url: "https://roadmap.sh/full-stack",
//         tags: ["programming", "web-development", "career"],
//         isRead: false,
//         isFavorite: true,
//         dateAdded: "2024-01-02"
//     },
//     {
//         id: "2",
//         title: "Modern CSS Techniques",
//         description: "Advanced CSS grid and flexbox patterns",
//         url: "https://css-tricks.com/modern-css",
//         tags: ["css", "web-development", "design"],
//         isRead: true,
//         isFavorite: false,
//         dateAdded: "2024-01-01"
//     },
//     {
//         id: "3",
//         title: "React Performance Optimization",
//         description: "Best practices for optimizing React applications",
//         url: "https://react-performance.dev",
//         tags: ["react", "javascript", "performance"],
//         isRead: true,
//         isFavorite: true,
//         dateAdded: "2023-12-28"
//     },
//     {
//         id: "6",
//         title: "AI in Web Development",
//         description: "Implementing AI features in web applications",
//         url: "https://ai-web-dev.guide",
//         tags: ["ai", "web-development", "programming"],
//         isRead: false,
//         isFavorite: false,
//         dateAdded: "2023-12-15"
//     },
//     {
//         id: "60",
//         title: "AI in Web Development",
//         description: "Implementing AI features in web applications",
//         url: "https://ai-web-dev.guide",
//         tags: ["ai", "web-development", "programming"],
//         isRead: false,
//         isFavorite: false,
//         dateAdded: "2023-12-15"
//     },
//     {
//         id: "11",
//         title: "Machine Learning Fundamentals",
//         description: "Introduction to ML concepts and algorithms",
//         url: "https://ml-basics.edu",
//         tags: ["machine-learning", "ai", "python"],
//         isRead: false,
//         isFavorite: true,
//         dateAdded: "2023-11-25"
//     },
//     {
//         id: "12",
//         title: "Redux Toolkit Guide",
//         description: "Modern state management with Redux Toolkit",
//         url: "https://redux-toolkit.guide",
//         tags: ["redux", "react", "javascript"],
//         isRead: true,
//         isFavorite: false,
//         dateAdded: "2023-11-20"
//     },
//     {
//         id: "13",
//         title: "Advanced Git Workflows",
//         description: "Professional Git branching and collaboration strategies",
//         url: "https://git-workflows.dev",
//         tags: ["git", "devops", "collaboration"],
//         isRead: false,
//         isFavorite: true,
//         dateAdded: "2023-11-15"
//     },
//     {
//         id: "14",
//         title: "Microservices Architecture",
//         description: "Designing scalable microservices systems",
//         url: "https://microservices.arch",
//         tags: ["architecture", "system-design", "devops"],
//         isRead: true,
//         isFavorite: false,
//         dateAdded: "2023-11-10"
//     },
//     {
//         id: "15",
//         title: "Web Security Fundamentals",
//         description: "Essential security practices for web applications",
//         url: "https://web-security.guide",
//         tags: ["security", "web-development", "best-practices"],
//         isRead: false,
//         isFavorite: true,
//         dateAdded: "2023-11-05"
//     },
// ]
// // export const dummyBookmarks: Bookmark[] = [
// //     {
// //         id: "1",
// //         title: "Full Stack Development Roadmap 2024",
// //         description: "Complete guide to becoming a full stack developer",
// //         url: "https://roadmap.sh/full-stack",
// //         tags: ["programming", "web-development", "career"],
// //         isRead: false,
// //         isFavorite: true,
// //         dateAdded: "2024-01-02"
// //     },
// //     {
// //         id: "2",
// //         title: "Modern CSS Techniques",
// //         description: "Advanced CSS grid and flexbox patterns",
// //         url: "https://css-tricks.com/modern-css",
// //         tags: ["css", "web-development", "design"],
// //         isRead: true,
// //         isFavorite: false,
// //         dateAdded: "2024-01-01"
// //     },
// //     {
// //         id: "3",
// //         title: "React Performance Optimization",
// //         description: "Best practices for optimizing React applications",
// //         url: "https://react-performance.dev",
// //         tags: ["react", "javascript", "performance"],
// //         isRead: true,
// //         isFavorite: true,
// //         dateAdded: "2023-12-28"
// //     },
// //     {
// //         id: "4",
// //         title: "TypeScript Design Patterns",
// //         description: "Common design patterns implemented in TypeScript",
// //         url: "https://typescript-patterns.dev",
// //         tags: ["typescript", "programming", "design-patterns"],
// //         isRead: false,
// //         isFavorite: false,
// //         dateAdded: "2023-12-25"
// //     },
// //     {
// //         id: "5",
// //         title: "UI/UX Research Methods",
// //         description: "Comprehensive guide to user research",
// //         url: "https://uxresearch.design",
// //         tags: ["design", "ux", "research"],
// //         isRead: false,
// //         isFavorite: true,
// //         dateAdded: "2023-12-20"
// //     },
// //     {
// //         id: "6",
// //         title: "AI in Web Development",
// //         description: "Implementing AI features in web applications",
// //         url: "https://ai-web-dev.guide",
// //         tags: ["ai", "web-development", "programming"],
// //         isRead: false,
// //         isFavorite: false,
// //         dateAdded: "2023-12-15"
// //     },
// //     {
// //         id: "7",
// //         title: "System Design Interview Preparation",
// //         description: "Common system design interview questions and solutions",
// //         url: "https://systemdesign.prep",
// //         tags: ["career", "system-design", "interview"],
// //         isRead: true,
// //         isFavorite: true,
// //         dateAdded: "2023-12-10"
// //     },
// //     {
// //         id: "8",
// //         title: "Web Accessibility Guidelines",
// //         description: "WCAG 2.1 implementation guide",
// //         url: "https://a11y.guide",
// //         tags: ["accessibility", "web-development", "design"],
// //         isRead: false,
// //         isFavorite: false,
// //         dateAdded: "2023-12-05"
// //     },
// //     {
// //         id: "9",
// //         title: "GraphQL Best Practices",
// //         description: "Advanced GraphQL patterns and optimization techniques",
// //         url: "https://graphql-patterns.dev",
// //         tags: ["graphql", "api", "programming"],
// //         isRead: true,
// //         isFavorite: false,
// //         dateAdded: "2023-12-01"
// //     },
// //     {
// //         id: "10",
// //         title: "Docker for Developers",
// //         description: "Comprehensive guide to Docker containerization",
// //         url: "https://docker-guide.dev",
// //         tags: ["docker", "devops", "programming"],
// //         isRead: false,
// //         isFavorite: true,
// //         dateAdded: "2023-11-28"
// //     },
// //     {
// //         id: "11",
// //         title: "Machine Learning Fundamentals",
// //         description: "Introduction to ML concepts and algorithms",
// //         url: "https://ml-basics.edu",
// //         tags: ["machine-learning", "ai", "python"],
// //         isRead: false,
// //         isFavorite: true,
// //         dateAdded: "2023-11-25"
// //     },
// //     {
// //         id: "12",
// //         title: "Redux Toolkit Guide",
// //         description: "Modern state management with Redux Toolkit",
// //         url: "https://redux-toolkit.guide",
// //         tags: ["redux", "react", "javascript"],
// //         isRead: true,
// //         isFavorite: false,
// //         dateAdded: "2023-11-20"
// //     },
// //     {
// //         id: "13",
// //         title: "Advanced Git Workflows",
// //         description: "Professional Git branching and collaboration strategies",
// //         url: "https://git-workflows.dev",
// //         tags: ["git", "devops", "collaboration"],
// //         isRead: false,
// //         isFavorite: true,
// //         dateAdded: "2023-11-15"
// //     },
// //     {
// //         id: "14",
// //         title: "Microservices Architecture",
// //         description: "Designing scalable microservices systems",
// //         url: "https://microservices.arch",
// //         tags: ["architecture", "system-design", "devops"],
// //         isRead: true,
// //         isFavorite: false,
// //         dateAdded: "2023-11-10"
// //     },
// //     {
// //         id: "15",
// //         title: "Web Security Fundamentals",
// //         description: "Essential security practices for web applications",
// //         url: "https://web-security.guide",
// //         tags: ["security", "web-development", "best-practices"],
// //         isRead: false,
// //         isFavorite: true,
// //         dateAdded: "2023-11-05"
// //     },
// //     {
// //         id: "16",
// //         title: "Node.js Performance Tuning",
// //         description: "Optimizing Node.js applications for scale",
// //         url: "https://nodejs-performance.dev",
// //         tags: ["nodejs", "performance", "javascript"],
// //         isRead: true,
// //         isFavorite: false,
// //         dateAdded: "2023-11-01"
// //     },
// //     {
// //         id: "17",
// //         title: "Design Systems Architecture",
// //         description: "Building and maintaining design systems",
// //         url: "https://design-systems.guide",
// //         tags: ["design", "design-systems", "ui"],
// //         isRead: false,
// //         isFavorite: true,
// //         dateAdded: "2023-10-28"
// //     },
// //     {
// //         id: "18",
// //         title: "AWS Solutions Architecture",
// //         description: "Best practices for AWS cloud architecture",
// //         url: "https://aws-solutions.cloud",
// //         tags: ["aws", "cloud", "architecture"],
// //         isRead: true,
// //         isFavorite: true,
// //         dateAdded: "2023-10-25"
// //     },
// //     {
// //         id: "19",
// //         title: "Database Optimization Techniques",
// //         description: "Performance tuning for SQL and NoSQL databases",
// //         url: "https://db-optimization.guide",
// //         tags: ["database", "performance", "sql"],
// //         isRead: false,
// //         isFavorite: false,
// //         dateAdded: "2023-10-20"
// //     },
// //     {
// //         id: "20",
// //         title: "Testing React Applications",
// //         description: "Comprehensive guide to testing React apps",
// //         url: "https://react-testing.guide",
// //         tags: ["react", "testing", "javascript"],
// //         isRead: true,
// //         isFavorite: true,
// //         dateAdded: "2023-10-15"
// //     },
// //     {
// //         id: "21",
// //         title: "Kubernetes for Developers",
// //         description: "Getting started with Kubernetes orchestration",
// //         url: "https://k8s-dev.guide",
// //         tags: ["kubernetes", "devops", "docker"],
// //         isRead: false,
// //         isFavorite: false,
// //         dateAdded: "2023-10-10"
// //     },
// //     {
// //         id: "22",
// //         title: "Frontend Performance Metrics",
// //         description: "Understanding and optimizing Core Web Vitals",
// //         url: "https://web-vitals.dev",
// //         tags: ["performance", "web-development", "metrics"],
// //         isRead: true,
// //         isFavorite: true,
// //         dateAdded: "2023-10-05"
// //     }
// // ];