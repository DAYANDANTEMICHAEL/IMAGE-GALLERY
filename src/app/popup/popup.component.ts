import { Component, Inject, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { fromEvent } from 'rxjs';
    
@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, FormsModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent implements AfterViewInit {
    currentPage: number = 1;
    hovered: boolean = false; 
    imageUrl: string | null = null; 
    showEmojiPicker: boolean = false; 
    selectedEmoji: string = ''; 
    showIcon: boolean = true; 
    description: string = '';
    currentUserId: string = ''; 
    email: string = ''; 
    avatar: string | null = null; 
    scale: number = 100; 
    top: number = 0; 
    left: number = 0; 
    imageWidth: number = 0; 
    imageHeight: number = 0; 
    brightness: number = 0; // Initialize brightness
    contrast: number = 0; // Initialize contrast
    fade: number = 0; // Initialize fade
    saturation: number = 0; // Initialize saturation
    temperature: number = 0; // Initialize temperature
    vignette: number = 0; // Initialize vignette
    selectedFilter: string = '';
    filters: string[] = [
        'none',
        'brightness(1.2)',
        'contrast(1.2)',
        'saturate(1.2)',
        // Add more filters as needed
    ];
    filterNames: { [key: string]: string } = {
        'none': 'Original',
        'brightness(1.2)': 'Bright',
        'contrast(1.2)': 'High Contrast',
        'saturate(1.2)': 'Vivid',
        // Add more filter names as needed
    };
    showDeleteConfirmation: boolean = false; // Initialize it as false

    constructor(private dialogRef: MatDialogRef<PopupComponent>) {
        this.currentUserId = ''; // Initialize in constructor
        this.email = ''; // Initialize in constructor
    }

    ngAfterViewInit(): void {
        fromEvent(window, "wheel").subscribe((ev: Event) => {
            const wheelEvent = ev as WheelEvent;
            const newScale = this.scale - wheelEvent.deltaY * 0.2;  
            this.scale = Math.max(newScale, 100);
            
            // Calculate the new top and left positions based on the mouse pointer
            this.top = wheelEvent.clientY - (this.scale / 2);
            this.left = wheelEvent.clientX - (this.scale / 2);
        });
      }
      
    goToPage(page: number): void {
        if (page >= 1 && page <= 4) {
            if (page === 1) {
                this.imageUrl = null; // Reset imageUrl when going back to page 1
            }
            this.currentPage = page; // Update current page
        }
    }

    getPageTitle(page: number): string {
        switch (page) {
            case 1: return 'Create New Post';
            case 2: return 'View Image';
            case 3: return 'Edit Image';
            case 4: return 'Upload';
            default: return '';
        }
    }

    onDone(): void {
        const userId = localStorage.getItem('userId'); // Retrieve user ID from local storage
        const email = localStorage.getItem('email'); // Retrieve email from local storage
        if (!userId) {
            console.error('User ID not found. Please log in again.');
            return; // Prevent upload if no user ID
        }

        // Create a canvas to draw the filtered image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = this.imageUrl || ''; // Use the original image URL or fallback to an empty string

        img.onload = () => {
            canvas.width = img.width; // Set canvas width to the original image width
            canvas.height = img.height; // Set canvas height to the original image height
            
            // Draw the original image on the canvas
            ctx?.drawImage(img, 0, 0);

            // Apply filters
            ctx!.filter = `
                brightness(${this.brightness + 100}%) 
                contrast(${this.contrast + 100}%) 
                saturate(${this.saturation + 100}%) 
                sepia(${this.fade / 100}) 
                hue-rotate(${this.temperature}deg) 
                drop-shadow(0 0 ${this.vignette}px black)
            `;
            ctx?.drawImage(img, 0, 0); // Redraw the image with filters applied

            const filteredImageUrl = canvas.toDataURL(); // Get the filtered image as a data URL

            const uploadData = {
                user_id: userId, // Use the retrieved user ID
                email: email, // Use the retrieved email
                image: filteredImageUrl, // Use the filtered image URL
                description: this.description,
                date: new Date().toISOString()
            };

            console.log('Upload Data:', uploadData); // Log the data being sent

            // Check if filteredImageUrl is valid
            if (!filteredImageUrl) {
                console.error('No filtered image URL available for upload.');
                return; // Prevent upload if no image
            }

            fetch('http://localhost/IMAGE-GALLERY/backend/upload.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uploadData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log(data.success);
                    this.dialogRef.close(); // Close the popup on successful upload
                    location.reload(); // Reload the page after closing the popup
                } else {
                    console.error(data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        };
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const img = new Image();
            img.onload = () => {
                this.imageWidth = img.width; // Set the original image width
                this.imageHeight = img.height; // Set the original image height
                const canvas = document.createElement('canvas');
                canvas.width = img.width; // Set canvas width to the original image width
                canvas.height = img.height; // Set canvas height to the original image height
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image on the canvas
                this.imageUrl = canvas.toDataURL(); // Set the imageUrl to the resized image
                this.goToPage(2); // Automatically go to the second page
            };
            img.src = URL.createObjectURL(file); // Load the image
        }
    }

    addEmoji(emoji: string): void { // {{ edit_2 }}
        this.description += emoji; // Append the emoji to the description
    }

    limitDescription(event: KeyboardEvent) {
        // Allow backspace and delete keys
        if (event.key === 'Backspace' || event.key === 'Delete') {
            return; // Allow deletion
        }

        // Prevent further input if the length is 15 or more
        if (this.description.length >= 15) {
            event.preventDefault(); // Prevent further input
        }
    }

    // New method to handle user login
    login(email: string, password: string): void {
        const loginData = { email, password };

        fetch('http://localhost/IMAGE-GALLERY/backend/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.currentUserId = data.userId; // Store user ID
                this.email = email; // Store email
                console.log('Login successful, User ID:', this.currentUserId);
                this.fetchUserProfile(this.currentUserId); // After successful login, fetch user profile
            } else {
                console.error(data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    fetchUserProfile(userId: string): void { // {{ edit_2 }}
        fetch(`http://localhost/IMAGE-GALLERY/backend/get_user.php?id=${userId}`) // Fetch user data
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error(data.error);
                } else {
                    this.email = data.firstName; // Store user's first name
                    this.avatar = data.avatar; // Store user's avatar
                }
            })
            .catch(error => {
                console.error('Error fetching user profile:', error);
            });
    }

    onDragOver(event: DragEvent): void { // {{ edit_1 }}
        event.preventDefault(); // Prevent default to allow drop
    }

    onDrop(event: DragEvent): void { // {{ edit_1 }}
        event.preventDefault(); // Prevent default behavior
        const files = event.dataTransfer?.files; // Get the dropped files
        if (files && files.length > 0) {
            this.onFileSelect({ target: { files } } as unknown as Event); // Call onFileSelect with the dropped files
        }
    }

    applyAdjustments(): void { // {{ edit_1 }}
        // Logic to apply adjustments to the image
        // This could involve manipulating the canvas or image styles
        const imageElement = document.querySelector('img'); // Select the image element
        if (imageElement) {
            imageElement.style.filter = `
                brightness(${this.brightness + 100}%) 
                contrast(${this.contrast + 100}%) 
                saturate(${this.saturation + 100}%) 
                sepia(${this.fade / 100}) 
                hue-rotate(${this.temperature}deg) 
                drop-shadow(0 0 ${this.vignette}px black)
            `;
        }
    }

    resetAdjustments(): void { // {{ edit_1 }}
        this.brightness = 0; // Reset brightness
        this.contrast = 0; // Reset contrast
        this.fade = 0; // Reset fade
        this.saturation = 0; // Reset saturation
        this.temperature = 0; // Reset temperature
        this.vignette = 0; // Reset vignette
        this.applyAdjustments(); // Apply the reset adjustments
    }

    applyFilter(filter: string) {
        this.selectedFilter = filter;
    }
}
