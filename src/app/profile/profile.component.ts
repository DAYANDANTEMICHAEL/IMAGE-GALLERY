import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupShowComponent } from '../popup-show/popup-show.component';
import { PopupComponent } from "../popup/popup.component"; // Import the PopupShowComponent

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, PopupShowComponent, PopupComponent], // Include PopupComponent and PopupShowComponent
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    cards: any[] = Array().fill({}); // Example for 9 cards
    firstname: string = '';
    avatar: string = ''; // New property for avatar
    currentUserId: number | undefined; // Declare currentUserId without initializing
    email: string = ''; // New property for emails
    selectedImage: string = ''; // New property for selected image
    showPopup: boolean = false; // Control popup visibility
    selectedImageId: number | undefined; // New property for selected image ID

    constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {} // Inject Router

    ngOnInit() {
        const userIdFromStorage = localStorage.getItem('userId'); // Retrieve user ID from local storage
        this.currentUserId = userIdFromStorage ? +userIdFromStorage : undefined; // Set currentUserId
        if (this.currentUserId) {
            this.getUserFirstname();
        } else {
            console.error("User ID not found.");
        }
    }

    getUserFirstname() {
        this.http.get<{
          error(error: any): unknown;
          firstName: string; avatar: string; email: string // Include email in type
        }>(`http://localhost/IMAGE-GALLERY/backend/get_user.php?id=${this.currentUserId}`)
            .subscribe(response => {
                if (response.firstName) {
                    this.firstname = response.firstName;
                    this.avatar = response.avatar; // Set avatar
                    this.email = response.email; // Set email
                    this.getUserGallery(); // Fetch user gallery images
                } else {
                    console.error(response.error); // Corrected to use dot notation for error property
                }
            });
    }

    getUserGallery() {
        this.http.get<{ id: number; image: string; }[]>(`http://localhost/IMAGE-GALLERY/backend/get_gallery.php?id=${this.currentUserId}&email=${this.email}`)
            .subscribe(images => {
                console.log(images); // Log the images array to check the response
                if (images.length === 0) { // Check if there are no images
                    console.log('No Uploaded Files'); // Log the message
                    this.cards = []; // Clear the cards array
                } else {
                    this.cards = images.map(image => {
                        const imagePath = `http://localhost/IMAGE-GALLERY/backend/uploads/${image.image}`; // Updated to include full URL
                        console.log('Image Path:', imagePath); // Log the image path for debugging
                        return { imagePath, id: image.id }; // Return the object with the image path and ID from the database
                    });
                }
            });
    }

    openPopup(imagePath: string, imageId: number) {
        this.selectedImage = imagePath; // Set the selected image path
        this.selectedImageId = imageId; // Set the selected image ID
        this.showPopup = true; // Show the popup
    }

    closePopup() {
        this.showPopup = false; // Hide the popup
    }

    updateUrl(cardId: string) {
        history.pushState(null, '', `/${cardId}`); // Update the URL to include the card ID
    }

}