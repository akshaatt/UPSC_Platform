import React from "react";
import { motion } from "framer-motion";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Phone,
} from "lucide-react";

export default function Footer({ onContactClick }) {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-300 mt-16">
      {/* Animated Background Overlay */}
      <div className="absolute inset-0">
        <motion.div
          className="w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15),transparent)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10 z-10">
        {/* About */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">About Satyapath</h3>
          <p className="text-sm leading-relaxed">
            Satyapath is your trusted companion for UPSC preparation – connecting
            study rooms, curated notes, mock tests and discussions to help you
            achieve your IAS/IPS dreams.
          </p>
          
          <button
  onClick={onContactClick}
  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white font-semibold hover:shadow-lg transition"
>
  Contact Us
</button>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2">
            {["Library", "Tests", "Study Rooms", "Dashboard"].map((link) => (
              <motion.li
                key={link}
                whileHover={{ x: 5 }}
                className="hover:text-cyan-400 cursor-pointer transition"
              >
                {link}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* UPSC Resources */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">UPSC Resources</h3>
          <ul className="space-y-2">
            {["Maps", "Previous Papers", "Newspapers", "Dynasty"].map((res) => (
              <motion.li
                key={res}
                whileHover={{ scale: 1.05 }}
                className="hover:text-cyan-400 cursor-pointer transition"
              >
                {res}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Newsletter + Socials */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Stay Updated</h3>
          <p className="text-sm mb-3">
            Subscribe for UPSC updates, test releases & topper insights.
          </p>
          <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-3 py-2 bg-transparent focus:outline-none text-sm flex-grow"
            />
            <button className="bg-cyan-600 px-4 py-2 hover:bg-cyan-700 transition">
              Subscribe
            </button>
          </div>

          {/* Socials */}
          <div className="flex space-x-4 mt-6">
            {[Facebook, Twitter, Instagram, Youtube, Linkedin].map(
              (Icon, i) => (
                <motion.a
                  key={i}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="p-2 bg-gray-700 rounded-full cursor-pointer hover:bg-cyan-600 transition"
                >
                  <Icon size={18} />
                </motion.a>
              )
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-gray-700/50 py-4 text-center text-sm z-10">
        <p>
          © {new Date().getFullYear()} Satyapath · All Rights Reserved | Built
          with ❤️ for UPSC Aspirants
        </p>
      </div>
    </footer>
  );
}
