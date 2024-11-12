import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity()
export class File<TUser extends { id: string } = any> {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: String })
  originalName: string;

  @Column({ type: String })
  fileName: string;

  @Column({ type: String, nullable: true })
  storage: string; // local, s3, etc

  @Column({ type: String })
  path: string; // directory or bucket name - relative to storage root

  @Column({ type: String })
  uploadType: string; // avatar, document, etc

  // Metadata
  @Column({ type: 'bigint', nullable: true })
  size: number;

  @Column({ type: String, nullable: true })
  mimeType: string;

  @Column({ type: String, nullable: true })
  extension: string;

  // For image files
  @Column({ type: 'integer', nullable: true })
  width: number;

  @Column({ type: 'integer', nullable: true })
  height: number;

  // Dynamic relation fields
  @Column({ type: String })
  objectModel: string;

  @Column({ type: 'bigint' })
  objectId: string;

  @Index()
  @Column({ type: String })
  objectKey: string;

  // Relations
  @ManyToOne('TUser', { nullable: false })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: TUser;

  @Column({ type: 'bigint' })
  uploadedById: string;

  // Additional useful fields
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
