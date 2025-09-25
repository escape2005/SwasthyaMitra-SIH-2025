import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

// 👇 Import icons
import { Stethoscope, Calendar, FileText, HeartPulse } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    heading: "Connect with a trusted professional",
    body: "Book video consultations with doctors that understand your health needs.",
    icon: <Stethoscope size={150} color="white" strokeWidth={1.5} />,
  },
  {
    heading: "Easy, instant scheduling",
    body: "Find a slot that works best for you and book it instantly.",
    icon: <Calendar size={150} color="white" strokeWidth={1.5} />,
  },
  {
    heading: "Your health, organized",
    body: "Access your prescriptions and reports on the go.",
    icon: <FileText size={150} color="white" strokeWidth={1.5} />,
  },
  {
    heading: "Ready to take charge of your health?",
    body: "",
    isFinal: true,
    icon: <HeartPulse size={150} color="white" strokeWidth={1.5} />,
  },
];

export default function LandingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const router = useRouter();

  // Animate content in
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  // Auto-advance except last screen
  useEffect(() => {
    if (currentIndex < slides.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  return (
    <LinearGradient colors={["#00B3FF", "#5603BD"]} style={styles.container}>
      {/* Persistent Header */}
      <Text style={styles.header}>JeevanSetu</Text>

      {/* Slide Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* 👇 Add Icon */}
        <View style={styles.iconContainer}>{slides[currentIndex].icon}</View>

        <Text style={styles.heading}>{slides[currentIndex].heading}</Text>
        {slides[currentIndex].body !== "" && (
          <Text style={styles.body}>{slides[currentIndex].body}</Text>
        )}

        {/* Final CTA */}
        {slides[currentIndex].isFinal && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.buttonText}>Join Now</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setCurrentIndex(i)}>
            <View
              style={[styles.dot, currentIndex === i && styles.activeDot]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    textAlign: "center",
  },
  iconContainer: {
    marginBottom: 30,
  },
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 34,
  },
  body: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 15,
  },
  button: {
    marginTop: 40,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 30,
    elevation: 3,
  },
  buttonText: {
    color: "#5603BD",
    fontWeight: "bold",
    fontSize: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 10,
    height: 10,
  },
});
