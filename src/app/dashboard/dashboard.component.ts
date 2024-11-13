import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PopupShowComponent } from '../popup-show/popup-show.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PopupShowComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    images: { id: number, path: string, description: string | null }[] = []; // Array to hold image paths with IDs and descriptions
    selectedImage: string | null = null; // Declare selectedImage property
    selectedImageId: number | null = null; // Declare selectedImageId property
    showPopup: boolean = false; // Declare showPopup property
    loading: boolean = false; // Declare loading property
    description: string | null = null; // Declare description property

    constructor(private http: HttpClient, private dialog: MatDialog, private router: Router, private dashboardService: DashboardService) {
        this.dashboardService.loadingState.subscribe(loading => {
            this.loading = loading; // Update loading state based on service
        });
    }

    ngOnInit() {
        this.fetchImages(); // Fetch images on component initialization
    }

    fetchImages() {
        this.loading = true; // Set loading to true when starting to fetch images
        this.http.get<{ id: number, images: string, description: string | null }[]>('http://localhost/IMAGE-GALLERY/backend/dashboard.php') // Update with your actual backend URL
            .subscribe(data => {
                // Check if response is valid
                if (data && Array.isArray(data)) {
                    this.images = data.map(item => ({
                        id: item.id,
                        path: `http://localhost/IMAGE-GALLERY/backend/uploads/${item.images}`,
                        description: item.description
                    })); // Construct full URLs with IDs and descriptions
                    
                    // Shuffle the images array to display them randomly
                    this.images = this.shuffleArray(this.images);
                } else {
                    this.images = []; // Fallback to an empty array
                }
                
                // Set loading to false after 5 seconds
                //setTimeout(() => {
                 //   this.loading = false; // Automatically set loading to false after 5 seconds
               // }, 5000); // 5000 milliseconds = 5 seconds
            }, error => {
                this.loading = false; // Ensure loading is set to false on error
            });
    }

    // Function to shuffle an array
    private shuffleArray(array: { id: number, path: string, description: string | null }[]): { id: number, path: string, description: string | null }[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    updateUrl(cardId: string) {
        history.pushState(null, '', `/${cardId}`); // Update the URL to include the card ID
    }

    openPopup(imagePath: string, id: number | null, description: string) { // Added description parameter
        this.selectedImage = imagePath; // Set the selected image path
        this.selectedImageId = id; // Fix: Set the selected image ID using the parameter 'id'
        this.showPopup = true; // Show the popup
        this.description = description; // Set the selected image description

        console.log('Selected Image ID:', this.selectedImageId);

        if (this.selectedImageId !== null) { // Check if selectedImageId is not null
            this.updateUrl(this.selectedImageId.toString()); // Call updateUrl with the selected image ID
        }
    }

    closePopup() {
        this.showPopup = false; // Hide the popup
        this.selectedImage = null; // Clear the selected image
        this.selectedImageId = null; // Clear the selected image ID
    }

    navigateTo(route: string) {
        if (route === '/dashboard') {
            window.location.reload(); // Automatically reload the page when navigating to dashboard
        } else {
            this.loading = true; // Set loading to true for other routes
            this.router.navigate([route]).then(() => {
                this.loading = false; // Reset loading after navigation
            });
        }
    }
}
