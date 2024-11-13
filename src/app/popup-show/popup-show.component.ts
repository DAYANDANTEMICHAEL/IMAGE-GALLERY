import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { formatDistanceToNow, format } from 'date-fns'; // Import date-fns for date formatting
import { Location } from '@angular/common';

// Define an interface for the response type
interface ReactionResponse {
    total_reacts: number; // Update the expected structure
    message: string; // Add this line to include the message property
    user_reacted: boolean; // Add this line to include the user_reacted property
}

// Define an interface for the user response type
interface UserResponse {
    firstName: string;
    avatar: string;
    email: string;
    description: string; // Add description to the response type
}

// Define an interface for the image response type
interface ImageResponse {
    id: number;
    image: string;
    description: string; // Add description to the image response type
    date: string; // Add date to the image response type
}

// Define an interface for the comment response type
interface CommentResponse {
    success: boolean; // Add success property
    // ... other properties if needed
}

// Define an interface for the comment type
interface Comment {
    user_id: number; // Assuming user_id is part of the comment structure
    comment: string; // Ensure the comment property is defined
    date: string; // Add date to the comment structure
}

@Component({
  selector: 'app-popup-show',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './popup-show.component.html',
  styleUrls: ['./popup-show.component.css']
})
export class PopupShowComponent implements OnInit {
    @Input() userId!: number | undefined;
    @Input() galleryId!: number;
    @Input() imagePath!: string;
    @Input() avatar!: string;
    @Input() firstName!: string;
    @Output() popupClosed = new EventEmitter<void>();
    @Output() imageSelected = new EventEmitter<number>();
    @Input() selectedImageId!: string;
    @Input() description!: string; // Add this line to receive the description
    @Input() comments: { userDetail: { firstName: string; avatar: string; email: string }; comment: string; date: string }[] = []; // Change the type of comments to accommodate user details
    @Input() datePosted!: string; // Add this line to receive the datePosted
    
    // New property to control visibility
    isVisible: boolean = true;
    showEmojiPicker: boolean = false;
    selectedEmoji: string = '';
    isFavorite: boolean = false;
    showIcon: boolean = false;
    email: string = '';
    imageId!: number; // New property to store the image IDs
    likeInfo: string = ''; // Add this line to declare the likeInfo property
    cards: { imagePath: string; id: number; description: string; date: string }[] = []; // Add this line to declare the cards property
    comment: string = ''; // Add this line to declare the comment property
    userIdOfSelectedImage!: number; // New property to store user ID of the selected image
    showDeleteConfirmation: boolean = false; // Add this line to declare the property
    @ViewChild('commentInput') commentInput!: ElementRef; // Import ElementRef

    constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private location: Location) {}

    ngOnInit() {
        const userIdFromStorage = localStorage.getItem('userId'); // Retrieve user ID from local storage
        this.userId = userIdFromStorage ? +userIdFromStorage : undefined; // Set userId
        if (this.userId) {
            this.fetchUserData(); // Fetch user data if userId is available
        } else {
            console.error("User ID not found."); // Log error if userId is not found
        }
        this.checkInitialReaction(); // Check initial reaction state
        this.cdr.detectChanges(); // Trigger change detection if necessary
        this.fetchComments(); // Call fetchComments when the component initializes
        this.getImageDate(); // Remove the argument to match the method signature
        this.fetchImageDescription(); // Call this method to fetch the description on initialization
    }

    fetchUserData() {
        if (!this.userId) {
            console.error('User ID is not provided');
            return; // Exit if userId is not available
        }

        this.http.get<{ firstName: string; avatar: string; email: string }>(`http://localhost/IMAGE-GALLERY/backend/get_user.php?id=${this.userId}`)
            .subscribe(response => {
                if (response.firstName) {
                    this.firstName = response.firstName;
                    this.avatar = response.avatar; // Set avatar
                    this.email = response.email; // Set email
                } else {
                    console.error('User not found or error in response');
                }

                // New code to fetch user ID of the selected image
                this.http.get<{ user_id: number }>(`http://localhost/IMAGE-GALLERY/backend/get_image_userid.php?id=${this.selectedImageId}`)
                    .subscribe(userResponse => {
                        console.log('Response from get_image_userid:', userResponse); // Log the entire response
                        if (userResponse.user_id) {
                            console.log('User ID of the selected image:', userResponse.user_id); // Log the user ID
                            this.userIdOfSelectedImage = userResponse.user_id; // Store user ID in a class property
                            // Fetch user details for the selected image
                            this.http.get<{ firstName: string; avatar: string; email: string }>(`http://localhost/IMAGE-GALLERY/backend/get_user.php?id=${userResponse.user_id}`)
                                .subscribe(userDetail => {
                                    this.firstName = userDetail.firstName; // Set firstName
                                    this.avatar = userDetail.avatar; // Set avatar
                                    this.email = userDetail.email; // Set email
                                }, error => {
                                    console.error('Error fetching user details:', error); // Log error
                                });
                        } else {
                            console.error('User ID not found in response'); // Handle case where user ID is not found
                        }
                    }, error => {
                        console.error('Error fetching user ID:', error); // Log error
                    });
            }, error => {
                console.error('Error fetching user data:', error);
            });
    }

    addEmoji(emoji: string): void {
      this.description += emoji;
  }

  limitDescription(event: KeyboardEvent) {
      if (event.key === 'Backspace' || event.key === 'Delete') {
          return;
      }

      if (this.comment.length >= 1500) {
          event.preventDefault();
      }
  }

    closePopup() {
        this.isVisible = false;
        this.popupClosed.emit();
    }

 

    toggleFavorite() {
        const cardId = this.selectedImageId; // Ensure this is set correctly
        const userId = this.userId; // Get the userId
        console.log('Selected Image ID in toggleFavorite:', cardId); // Log the ID
        console.log('User ID being sent to PHP:', userId); // Log the user ID

        if (cardId) {
            const idToSend = Number(cardId); // Convert to number
            console.log('ID being sent to PHP:', idToSend); // Log the ID being sent

            this.http.post<ReactionResponse>('http://localhost/IMAGE-GALLERY/backend/toggle_reaction.php', {
                id: idToSend, // Send the ID as imageId
                userId: userId // Send the user ID
            }).subscribe(response => {
                console.log('Raw response:', response); // Log the raw response
                console.log('Reaction updated:', response);

                // Reverse the logic for updating the isFavorite state
                if (response.message === 'Reaction added') {
                    this.isFavorite = true; // Set to true if reaction was added
                } else if (response.message === 'Reaction removed') {
                    this.isFavorite = false; // Set to false if reaction was removed
                }

                // Call checkInitialReaction to update the UI instantly
                this.checkInitialReaction();
            }, error => {
                console.error('Error updating reaction:', error);
                console.error('Response body:', error.error); // Log the response body for more details
            });
        } else {
            console.error('No card ID found for reaction.'); // Ensure cardId is used correctly
        }
    }

    // New method to check the initial reaction state
    checkInitialReaction() {
        if (this.selectedImageId) {
            const cardId = this.selectedImageId; // Store selected image ID
            const userId = this.userId; // Store user ID
            
            this.http.get<ReactionResponse>(`http://localhost/IMAGE-GALLERY/backend/get_reaction.php?id=${this.selectedImageId}&userId=${userId}`)
                .subscribe(response => {
                    this.isFavorite = response.user_reacted; // Set isFavorite based on user reaction
                    this.updateLikeInfo(response.total_reacts); // Update like info
                }, error => {
                    console.error('Error fetching reaction data:', error);
                });
        }
    }

    // New method to update like info
    updateLikeInfo(totalReacts: number) {
        const currentUserId = this.userId; // Assuming this.userId is the current user's ID

        if (totalReacts === 0) {
            this.likeInfo = 'Be the first to like this post'; // No likes
        } else if (totalReacts === 1) {
            if (this.isFavorite) {
                this.likeInfo = 'You like this post'; // You are the only one
            } else {
                this.likeInfo = `${totalReacts} like this post`; // Other user liked it
            }
        } else {
            if (this.isFavorite) {
                this.likeInfo = `You and ${totalReacts - 1} ${totalReacts - 1 === 1 ? 'other like' : 'others like'} this post`; // You and others
            } else {
                this.likeInfo = `${totalReacts} ${totalReacts === 1 ? 'like' : 'likes'} this post`; // Others only
            }
        }
    }

    getUserGallery() {
        const currentUserId = this.userId; 
        this.http.get<{ id: number; image: string; description: string; date: string; }[]>(`http://localhost/IMAGE-GALLERY/backend/get_gallery.php?id=${currentUserId}&email=${this.email}`)
            .subscribe(images => {
                console.log('Full API Response:', images); // Log the full response
                if (images.length === 0) {
                    console.log('No Uploaded Files');
                    this.cards = [];
                } else {
                    this.cards = images.map(image => {
                        const imagePath = `http://localhost/IMAGE-GALLERY/backend/uploads/${image.image}`;
                        console.log('Image Path:', imagePath);
                        console.log('Image Description:', image.description); // Log the description
                        console.log('Image Date:', image.date); // Log the date
                        return { imagePath, id: image.id, description: image.description, date: image.date }; 
                    });
                }
            });
    }

    // Add this method to handle image selection
    selectImage(image: { imagePath: string; id: number; description: string; date: string }) {
        this.imagePath = image.imagePath; // Set the image path
        this.selectedImageId = image.id.toString(); // Set the selected image ID
        this.description = image.description; // Set the description of the selected image
        this.getImageDate(); // Fetch the date for the selected image (no arguments needed)
        console.log('Selected Image ID:', this.selectedImageId); // Log the selected image ID
    }

    sendComment() {
        if (this.comment.trim()) {
            const payload = {
                user_id: this.userId,
                cardId: this.selectedImageId,
                comment: this.comment
            };

            console.log('Sending Comment:', payload);

            this.http.post<CommentResponse>('http://localhost/IMAGE-GALLERY/backend/send_comment.php', payload, {
                withCredentials: true // Ensure credentials are included
            })
            .subscribe(response => {
                console.log('Response:', response);
                if (response.success) {
                    // Fetch user details for the current user
                    this.http.get<{ firstName: string; avatar: string; email: string }>(`http://localhost/IMAGE-GALLERY/backend/get_user.php?id=${this.userId}`)
                        .subscribe(userDetail => {
                            // Add the new comment to the comments array without reloading
                            this.comments.push({
                                userDetail: userDetail, // Use fetched user details
                                comment: this.comment,
                                date: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })).toISOString() // Use Philippine time
                            });
                            this.comment = ''; // Clear the comment input after sending
                        });
                }
            }, error => {
                console.error('Error:', error);
            });
        }
    }

    // New method to fetch comments for the selected image
    fetchComments() {
        // Now fetch comments
        this.http.get<{ user_id: number; comment: string; date: string }[]>(`http://localhost/IMAGE-GALLERY/backend/get_comment.php?image_id=${this.selectedImageId}`)
            .subscribe(comments => {
                console.log('Fetched comments:', comments); // Log the fetched comments
                const userRequests = comments.map(comment => 
                    this.http.get<{ firstName: string; avatar: string; email: string }>(`http://localhost/IMAGE-GALLERY/backend/get_user.php?id=${comment.user_id}`)
                        .pipe(map(userDetail => ({
                            userDetail,
                            comment: comment.comment,
                            date: comment.date // Include the date in the user comment object
                        })))
                );

                // Wait for all user requests to complete
                forkJoin(userRequests).subscribe(userComments => {
                    this.comments = userComments; // Update to store user comments with details and date
                });
            }, error => {
                console.error('Error fetching comments:', error);
            });
    }
    
    getFormattedDate(date: string | undefined): string {
        if (!date) {
            return 'Invalid date'; // Return a fallback message
        }

        // Convert the date format to ISO 8601
        const isoDate = date.replace(' ', 'T'); // Replace space with 'T' for ISO format
        const datePosted = new Date(isoDate);
        
        // Check if the date is valid
        if (isNaN(datePosted.getTime())) {
            console.error('Invalid date:', date); // Log the invalid date
            return 'Invalid date'; // Return a fallback message
        }

        const now = new Date();
        const hoursDifference = Math.abs(now.getTime() - datePosted.getTime()) / (1000 * 3600);

        if (hoursDifference < 24) {
            return formatDistanceToNow(datePosted, { addSuffix: true }); // e.g., "5 hours ago"
        } else {
            return format(datePosted, 'MMMM d, yyyy'); // e.g., "November 1, 2024"
        }
    }

    getImageDate() { // Removed the imageId parameter
        const imageId = this.selectedImageId; // Use selectedImageId directly
        this.http.get<{ date: string; error?: string }>(`http://localhost/IMAGE-GALLERY/backend/get_image_date.php?image_id=${imageId}`)
            .subscribe(response => {
                if (response.error) {
                    console.error('Error fetching image date:', response.error);
                } else {
                    this.datePosted = response.date; // Set the datePosted property
                }
            }, error => {
                console.error('Error fetching image date:', error);
            });
    }

    // New method to fetch the image description
    fetchImageDescription() {
        this.http.get<{ description: string }>(`http://localhost/IMAGE-GALLERY/backend/get_description.php?id=${this.selectedImageId}`)
            .subscribe(response => {
                this.description = response.description; // Update the description property
                console.log('Fetched Image Description:', this.description); // Log the fetched description
            }, error => {
                console.error('Error fetching image description:', error);
            });
    }

    // Add a new method to handle keydown events
    handleKeydown(event: KeyboardEvent) { // Specify KeyboardEvent type
        if (event.key === 'Enter') {
            this.sendComment(); // Call sendComment when Enter is pressed
            event.preventDefault(); // Prevent default action (like form submission)
        }
    }

    deleteImage() {
        const id = this.selectedImageId; // Use selectedImageId as id
        console.log('Attempting to delete image with ID:', id); // Log the ID
        this.http.delete<{ success: boolean; message: string }>(`http://localhost/IMAGE-GALLERY/backend/delete_image.php?id=${id}`)
            .subscribe(response => {
                console.log('Delete response:', response); // Log the full response for debugging
                if (response.success) {
                    console.log('Image deleted successfully:', response.message);
                    this.closePopup(); // Close the popup after deletion
                } else {
                    console.warn('Delete operation was not successful:', response.message); // Log warning instead of error
                    // Optionally, you can still close the popup or handle UI updates here
                }
            }, error => {
                console.error('Error deleting image:', error); // Log any errors
            });
    }

    reloadPage() {
        window.location.href = '/dashboard'; // Redirect to the dashboard
    }

    openCommentSection() {
        this.commentInput.nativeElement.focus(); // Focus on the comment input
    }

}
