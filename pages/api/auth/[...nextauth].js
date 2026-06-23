import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "../../../lib/mongodb";
import User from "../../../models/User";
import Business from "../../../models/Business";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();

        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        });
        if (!user) {
          throw new Error("No account found with this email");
        }

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        const business = await Business.findOne({ owner: user._id });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          businessId: business ? business._id.toString() : null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.businessId = user.businessId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.businessId = token.businessId;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
