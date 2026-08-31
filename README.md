# punjabveterinary.com

Build a production-ready, full-stack, mobile-first eCommerce web application for a veterinary medical store. The platform should match the usability and structure of modern marketplaces like Daraz and Amazon, while being simple and accessible for local users.

🏢 Business Details:

Business Name: Punjab Veterinary Medical Store

CEO: Qaiser Hussain

Location: Islam Nagar Road, Sillanwali, Pakistan

Contact (Phone & WhatsApp): +92 306 5757283

🎯 Product Vision:

Create a highly professional, scalable online store where users can browse, search, and purchase veterinary medicines and vaccines بسهولة (easily). The experience must be optimized for mobile users, especially Android devices, with a clean and intuitive interface.

🌐 Language System:

Fully bilingual: English and Urdu

Seamless toggle between languages

Persist user language preference

🎨 UI/UX REQUIREMENTS:

Clean, structured layout inspired by Amazon/Daraz

Mobile-first design (priority)

Sticky header with search bar

Category-based navigation

Large touch-friendly buttons

Green and white theme (health & agriculture trust)

Fast loading and minimal clutter

🔐 AUTHENTICATION (Firebase आधारित system):

Implement a secure authentication system using Firebase:

Email & Password Signup

Email & Password Login

Continue with Google (OAuth)

Password reset functionality

Secure logout

👤 USER ACCOUNT SYSTEM:

Each authenticated user must have a dashboard with:

Profile Information (Name, Email, Phone, Address)

Order History (all previous purchases with status)

Cart History (persistent across sessions)

Saved Address for quick checkout

🛒 ECOMMERCE FUNCTIONALITY:

Homepage:

Search bar with autocomplete

Promotional banners

Product categories:

Medicines

Vaccines

Animal Supplements

Dairy Products

Featured and best-selling products

Product Listing:

Grid layout (Daraz-style)

Filters (Category, Price, Popularity)

Each product card includes:

Image

Title

Price

Short description

Add to Cart

WhatsApp Order option

Product Detail Page:

High-quality product image

Full description

Pricing and availability

Add to Cart / Buy Now

Related products

Cart & Checkout:

Persistent cart using Firebase

Simple checkout form:

Name

Phone

Address

Order placement with confirmation

🧾 ORDER MANAGEMENT SYSTEM:

Use Firebase Firestore (or Realtime Database):

Store user orders with:

User ID

Products

Quantity

Total Price

Address

Order Status (Pending / Completed)

Timestamp

⚙️ ADMIN PANEL (Secure Dashboard):

Provide a dedicated admin interface with role-based access:

Admin login authentication

Add / Edit / Delete products

Upload images

Manage categories

View all orders

Update order status

View customers

Basic analytics (sales & popular items)

🧠 DATABASE STRUCTURE:

Design scalable collections:

users

products

categories

carts

orders

Ensure relational consistency using unique user IDs.

🔗 INTEGRATIONS:

Firebase Authentication

Firebase Firestore Database

Google Sign-In

WhatsApp API (click-to-order with prefilled message)

🔔 USER EXPERIENCE ENHANCEMENTS:

Toast notifications (cart updates, order success)

Loading indicators

Error handling

Search suggestions

Smooth transitions and animations

🔐 SECURITY & PERFORMANCE:

Firebase security rules (user data isolation)

Admin-only protected routes

Optimized images and lazy loading

Lightweight and fast frontend

📍 CONTACT & FOOTER:

Address: Islam Nagar Road, Sillanwali

Click-to-call button

WhatsApp floating button

Google Maps integration

Clean footer with business info

⚡ FINAL DELIVERY REQUIREMENTS:

Clean, maintainable, and scalable code

Production-ready structure

Easily deployable

Future-ready for mobile app conversion

💬 WhatsApp Auto Message:

"Hello, I want to order this product from Punjab Veterinary Medical Store."

🔥 FINAL NOTE:

The application must reflect trust, simplicity, and professionalism, tailored for farmers and livestock owners with minimal technical knowledge.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://punjabvet.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ab490b8c-80ba-4122-b1a7-91e95ccaebe9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
