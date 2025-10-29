"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      " bg-Container text-Container-foreground shadow-sm", // Changed from shadow-xs to shadow-sm
      className
    )}
    {...props}
  />
))
Container.displayName = "Container"


const ContainerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
ContainerHeader.displayName = "ContainerHeader"

const ContainerTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> // Corrected type to HTMLDivElement
>(({ className, ...props }, ref) => (
  <div // Changed from h3 to div for flexibility, apply font styles via className
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight", // Adjusted size to text-lg
      className
    )}
    {...props}
  />
))
ContainerTitle.displayName = "ContainerTitle"

const ContainerDescription = React.forwardRef<
  HTMLDivElement, // Corrected type to HTMLDivElement
  React.HTMLAttributes<HTMLDivElement> // Corrected type to HTMLDivElement
>(({ className, ...props }, ref) => (
  <div // Changed from p to div for flexibility
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
    
  />
))
ContainerDescription.displayName = "ContainerDescription"

const ContainerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
ContainerContent.displayName = "ContainerContent"

const ContainerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
ContainerFooter.displayName = "ContainerFooter"

export { Container, ContainerHeader, ContainerFooter, ContainerTitle, ContainerDescription, ContainerContent }
